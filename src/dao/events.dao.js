import Event from '../models/Event.js';

const ALLOWED_SORT_FIELDS = [
    'date',
    'title',
    'price'
];

class EventsDAO {
    async getAll(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = 'date'
        } = options;

        const sortField = sort.startsWith('-')
            ? sort.substring(1)
            : sort;

        const normalizedSort =
            sort.startsWith('-')
                ? `-${sortField}`
                : sortField;

        if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
            throw new Error(
                `Campo de ordenamiento no permitido: ${sortField}`
            );
        }

        const skip = (page - 1) * limit;

        const events = await Event.find(filters)
            .sort(normalizedSort)
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
                returnDocument: 'after',
                runValidators: true
            }
        );
    }
}

export default EventsDAO;
