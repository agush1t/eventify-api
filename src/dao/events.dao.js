import crypto from 'crypto';

const events = [];

class EventsDAO {
    async getAll() {
        return events;
    }

    async getById(id) {
        return events.find((event) => event.id === id);
    }

    async create(event) {
        const newEvent = {
            id: crypto.randomUUID(),
            ...event
        };

        events.push(newEvent);

        return newEvent;
    }

    async update(id, eventData) {
        const eventIndex = events.findIndex((event) => event.id === id);

        if (eventIndex === -1) {
            return null;
        }

        events[eventIndex] = {
            ...events[eventIndex],
            ...eventData
        };

        return events[eventIndex];
    }
}

export default EventsDAO;
