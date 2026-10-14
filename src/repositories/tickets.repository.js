import TicketsDAO from '../dao/tickets.dao.js';

const ticketsDAO = new TicketsDAO();

class TicketsRepository {
    async create(ticketData, session) {
        return await ticketsDAO.create(ticketData, session);
    }

    async getById(id, session) {
        return await ticketsDAO.getById(id, session);
    }

    async getByUser(userId) {
        return await ticketsDAO.getByUser(userId);
    }

    async getByEvent(eventId) {
        return await ticketsDAO.getByEvent(eventId);
    }

    async findActiveByUserAndEvent(userId, eventId, session) {
        return await ticketsDAO.findActiveByUserAndEvent(
            userId,
            eventId,
            session
        );
    }

    async getActiveQuantityByEvent(eventId, session) {
        return await ticketsDAO.getActiveQuantityByEvent(eventId, session);
    }

    async cancelIfActive(id, session) {
        return await ticketsDAO.cancelIfActive(id, session);
    }

    async update(id, ticketData) {
        return await ticketsDAO.update(id, ticketData);
    }
}

export default TicketsRepository;
