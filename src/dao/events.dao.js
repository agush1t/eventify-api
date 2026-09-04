const events = [];

class EventsDAO {
    async getAll() {
        return events;
    }

    async create(event) {
        events.push(event);
        return event;
    }
}

export default EventsDAO;