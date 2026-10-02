import TicketsDAO from '../dao/tickets.dao.js';

const ticketsDAO = new TicketsDAO();

class TicketsRepository {
    async create(ticketData) {
        return await ticketsDAO.create(ticketData);
    }

    async getById(id) {
        return await ticketsDAO.getById(id);
    }

    async getByUser(userId) {
        return await ticketsDAO.getByUser(userId);
    }

    async getByEvent(eventId) {
        return await ticketsDAO.getByEvent(eventId);
    }

    async findActiveByUserAndEvent(userId, eventId) {
        return await ticketsDAO.findActiveByUserAndEvent(
            userId,
            eventId
        );
    }

    async getActiveQuantityByEvent(eventId) {
        return await ticketsDAO.getActiveQuantityByEvent(eventId);
    }

    async update(id, ticketData) {
        return await ticketsDAO.update(id, ticketData);
    }
}

export default TicketsRepository;
