import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import TicketsRepository from '../repositories/tickets.repository.js';
import EventsRepository from '../repositories/events.repository.js';
import generateError from '../utils/generateError.js';
import TicketDTO from '../dtos/ticket.dto.js';
import {
    sendTicketConfirmationEmail,
    sendTicketCancellationEmail
} from '../utils/mailer.js';

const ticketsRepository = new TicketsRepository();
const eventsRepository = new EventsRepository();

class TicketsService {
    async sendEmailSafely(emailFunction, emailData, context) {
        try {
            await emailFunction(emailData);
        } catch (error) {
            console.error(
                `No se pudo enviar el correo de ${context}:`,
                error.message
            );
        }
    }

    async createTicket(eventId, user, quantity) {
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw generateError('La cantidad debe ser un número entero mayor a 0', 400);
        }

        let ticket;
        let event;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                // Todos los cambios de reservas escriben sobre el mismo evento.
                // MongoDB detecta el conflicto y reintenta con una vista actualizada.
                event = await eventsRepository.touchForReservation(eventId, session);
                if (!event) {
                    const existing = await eventsRepository.getById(eventId, session);
                    if (!existing) throw generateError('Evento no encontrado', 404);
                    throw generateError('El evento no está disponible para inscripciones', 400);
                }

                const existingTicket = await ticketsRepository.findActiveByUserAndEvent(
                    user.id, eventId, session
                );
                if (existingTicket) {
                    throw generateError('Ya tenés una inscripción activa para este evento', 409);
                }

                const occupied = await ticketsRepository.getActiveQuantityByEvent(eventId, session);
                const available = Math.max(event.capacity - occupied, 0);
                if (available < quantity) {
                    throw generateError(`No hay cupos suficientes. Cupos disponibles: ${available}`, 409);
                }

                ticket = await ticketsRepository.create({
                    user: user.id,
                    event: eventId,
                    status: 'confirmed',
                    quantity,
                    reservationCode: `EVT-${randomUUID()}`
                }, session);
            });
        } finally {
            await session.endSession();
        }

        await this.sendEmailSafely(
            sendTicketConfirmationEmail,
            { to: user.email, event, ticket },
            'confirmación de inscripción'
        );
        return new TicketDTO(ticket);
    }

    async getMyTickets(userId) {
        const tickets = await ticketsRepository.getByUser(userId);

        return tickets.map(ticket => new TicketDTO(ticket));
    }

    async getEventTickets(eventId, user) {
        const event = await eventsRepository.getById(eventId);

        if (!event) {
            throw generateError('Evento no encontrado', 404);
        }

        const isOwner =
            event.organizer.toString() === user.id.toString();

        if (user.role !== 'admin' && !isOwner) {
            throw generateError(
                'No tenés permisos para consultar los tickets de este evento',
                403
            );
        }

        const tickets = await ticketsRepository.getByEvent(eventId);

        return tickets.map(ticket => new TicketDTO(ticket));
    }

    async cancelTicket(ticketId, user) {
        let cancelledTicket;
        let event;
        let ownerEmail;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const ticket = await ticketsRepository.getById(ticketId, session);
                if (!ticket) throw generateError('Ticket no encontrado', 404);

                const ownerId = ticket.user?._id?.toString() || ticket.user?.toString();
                if (user.role !== 'admin' && ownerId !== user.id.toString()) {
                    throw generateError('No tenés permisos para cancelar este ticket', 403);
                }
                if (ticket.status === 'cancelled') {
                    throw generateError('El ticket ya está cancelado', 400);
                }

                // Escribir el evento coordina cancelaciones, reservas y cambios de capacidad.
                event = await eventsRepository.getById(ticket.event, session);
                if (event) await eventsRepository.touchForCancellation(event._id, session);

                cancelledTicket = await ticketsRepository.cancelIfActive(ticketId, session);
                if (!cancelledTicket) throw generateError('El ticket ya está cancelado', 400);
                ownerEmail = ticket.user?.email;
            });
        } finally {
            await session.endSession();
        }

        if (ownerEmail && event) {
            await this.sendEmailSafely(
                sendTicketCancellationEmail,
                { to: ownerEmail, event, ticket: cancelledTicket },
                'cancelación de inscripción'
            );
        }
        return new TicketDTO(cancelledTicket);
    }
}

export default TicketsService;
