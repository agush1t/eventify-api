import EventsRepository from '../repositories/events.repository.js';

const eventsRepository = new EventsRepository();

class EventsService {
    async getAllEvents() {
        return await eventsRepository.getAll();
    }

    async createEvent(event) {
        return await eventsRepository.create(event);
    }
}

export default EventsService;