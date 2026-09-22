import EventsRepository from '../repositories/events.repository.js';

const eventsRepository = new EventsRepository();

class EventsService {
    async getAllEvents() {
        return await eventsRepository.getAll();
    }

    async getEventById(id) {
        return await eventsRepository.getById(id);
    }

    async createEvent(event) {
        return await eventsRepository.create(event);
    }

    async updateEvent(id, eventData) {
        return await eventsRepository.update(id, eventData);
    }
}

export default EventsService;
