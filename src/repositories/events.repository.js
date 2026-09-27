import EventsDAO from '../dao/events.dao.js';

const eventsDAO = new EventsDAO();

class EventsRepository {
    async getAll(filters = {}, options = {}) {
        return await eventsDAO.getAll(filters, options);
    }

    async getById(id) {
        return await eventsDAO.getById(id);
    }

    async create(eventData) {
        return await eventsDAO.create(eventData);
    }

    async update(id, eventData) {
        return await eventsDAO.update(id, eventData);
    }
}

export default EventsRepository;
