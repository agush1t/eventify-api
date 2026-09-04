import EventsDAO from '../dao/events.dao.js';

const eventsDAO = new EventsDAO();

class EventsRepository {
    async getAll() {
        return await eventsDAO.getAll();
    }

    async create(event) {
        return await eventsDAO.create(event);
    }
}

export default EventsRepository;