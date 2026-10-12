
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
        const event = await eventsRepository.getById(eventId);

        if (!event) {
            throw generateError('Evento no encontrado', 404);
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

        if (!Number.isInteger(quantity) || quantity <= 0) {
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
                409
            );
        }

        const occupiedQuantity =
            await ticketsRepository.getActiveQuantityByEvent(eventId);

        const availableQuantity = Math.max(
            event.capacity - occupiedQuantity,
            0
        );

        if (availableQuantity < quantity) {
            throw generateError(
                `No hay cupos suficientes. Cupos disponibles: ${availableQuantity}`,
                409
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

        await this.sendEmailSafely(
            sendTicketConfirmationEmail,
            {
                to: user.email,
                event,
                ticket
            },
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
        const ticket = await ticketsRepository.getById(ticketId);

        if (!ticket) {
            throw generateError('Ticket no encontrado', 404);
        }

        const ticketOwnerId =
            ticket.user?._id?.toString() ||
            ticket.user?.toString();

        const isOwner = ticketOwnerId === user.id.toString();

        if (user.role !== 'admin' && !isOwner) {
            throw generateError(
                'No tenés permisos para cancelar este ticket',
                403
            );
        }

        if (ticket.status === 'cancelled') {
            throw generateError('El ticket ya está cancelado', 400);
        }

        const cancelledTicket = await ticketsRepository.update(
            ticketId,
            {
                status: 'cancelled',
                cancelledAt: new Date()
            }
        );

        const event = await eventsRepository.getById(ticket.event);

        // El correo debe llegar al titular del ticket.
        // Si el usuario ya no existe, no se envía.
        if (ticket.user?.email && event) {
            await this.sendEmailSafely(
                sendTicketCancellationEmail,
                {
                    to: ticket.user.email,
                    event,
                    ticket: cancelledTicket
                },
                'cancelación de inscripción'
            );
        }

        return new TicketDTO(cancelledTicket);
    }
}

export default TicketsService;