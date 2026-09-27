import Event from '../models/Event.js';

class EventsDAO {
    async getAll(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = 'date'
        } = options;

        const skip = (page - 1) * limit;

        const events = await Event.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Event.countDocuments(filters);

        return {
            events,
            total
        };
    }

    async getById(id) {
        return await Event.findById(id);
    }

    async create(eventData) {
        return await Event.create(eventData);
    }

    async update(id, eventData) {
        return await Event.findByIdAndUpdate(
            id,
            eventData,
            {
                new: true,
                runValidators: true
            }
        );
    }
}

export default EventsDAO;
