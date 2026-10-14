import EventsDAO from '../dao/events.dao.js';

const eventsDAO = new EventsDAO();

class EventsRepository {
    async getAll(filters = {}, options = {}) {
        return await eventsDAO.getAll(filters, options);
    }

    async getById(id, session) {
        return await eventsDAO.getById(id, session);
    }

    async touchForReservation(id, session) {
        return await eventsDAO.touchForReservation(id, session);
    }

    async touchForCancellation(id, session) {
        return await eventsDAO.touchForCancellation(id, session);
    }

    async create(eventData) {
        return await eventsDAO.create(eventData);
    }

    async update(id, eventData) {
        return await eventsDAO.update(id, eventData);
    }
}

export default EventsRepository;
