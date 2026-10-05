import TicketsRepository from '../repositories/tickets.repository.js';
import EventsRepository from '../repositories/events.repository.js';
import generateError from '../utils/generateError.js';
import {
    sendTicketConfirmationEmail,
    sendTicketCancellationEmail
} from '../utils/mailer.js';


const ticketsRepository = new TicketsRepository();
const eventsRepository = new EventsRepository();

class TicketsService {
    async createTicket(eventId, user, quantity) {
        const event = await eventsRepository.getById(eventId);

        if (!event) {
            throw generateError(
                'Evento no encontrado',
                404
            );
        }

        if (event.status !== 'published') {
            throw generateError(
                'El evento no está disponible para inscripciones',
                400
            );
        }

        if (new Date(event.date) <= new Date()) {
            throw generateError(
                'No se puede inscribir a un evento que ya comenzó',
                400
            );
        }

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            throw generateError(
                'La cantidad debe ser un número entero mayor a 0',
                400
            );
        }

        const existingTicket =
            await ticketsRepository.findActiveByUserAndEvent(
                user.id,
                eventId
            );

        if (existingTicket) {
            throw generateError(
                'Ya tenés una inscripción activa para este evento',
                400
            );
        }

        const occupiedQuantity =
            await ticketsRepository.getActiveQuantityByEvent(
                eventId
            );

        const availableQuantity = Math.max(
            event.capacity - occupiedQuantity,
            0
        );

        if (availableQuantity < quantity) {
            throw generateError(
                `No hay cupos suficientes. Cupos disponibles: ${availableQuantity}`,
                400
            );
        }

        const reservationCode =
            `EVT-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()}`;

        const ticket = await ticketsRepository.create({
            user: user.id,
            event: eventId,
            status: 'confirmed',
            quantity,
            reservationCode
        });

        await sendTicketConfirmationEmail({
            to: user.email,
            event,
            ticket
        });

        return ticket;
    }

    async getMyTickets(userId) {
        return await ticketsRepository.getByUser(userId);
    }

    async getEventTickets(eventId, user) {
        const event = await eventsRepository.getById(eventId);

        if (!event) {
            throw generateError(
                'Evento no encontrado',
                404
            );
        }

        const isOwner =
            event.organizer.toString() === user.id.toString();

        if (
            user.role !== 'admin' &&
            !isOwner
        ) {
            throw generateError(
                'No tenés permisos para consultar los tickets de este evento',
                403
            );
        }

        return await ticketsRepository.getByEvent(eventId);
    }

    async cancelTicket(ticketId, user) {
        const ticket =
            await ticketsRepository.getById(ticketId);

        if (!ticket) {
            throw generateError(
                'Ticket no encontrado',
                404
            );
        }

        const isOwner =
            ticket.user.toString() === user.id.toString();

        if (
            user.role !== 'admin' &&
            !isOwner
        ) {
            throw generateError(
                'No tenés permisos para cancelar este ticket',
                403
            );
        }

        if (ticket.status === 'cancelled') {
            throw generateError(
                'El ticket ya está cancelado',
                400
            );
        }

        const cancelledTicket = await ticketsRepository.update(
            ticketId,
            {
                status: 'cancelled',
                cancelledAt: new Date()
            }
        );

        const event = await eventsRepository.getById(
            ticket.event
        );

        await sendTicketCancellationEmail({
            to: user.email,
            event,
            ticket: cancelledTicket
        });

        return cancelledTicket;
    }
}

export default TicketsService;
