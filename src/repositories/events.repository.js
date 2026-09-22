import EventsDAO from '../dao/events.dao.js';

const eventsDAO = new EventsDAO();

class EventsRepository {
    async getAll() {
        return await eventsDAO.getAll();
    }

    async getById(id) {
        return await eventsDAO.getById(id);
    }

    async create(event) {
        return await eventsDAO.create(event);
    }

    async update(id, eventData) {
        return await eventsDAO.update(id, eventData);
    }
}

export default EventsRepository;
