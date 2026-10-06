import EventsService from '../services/events.service.js';
import EventDTO from '../dtos/event.dto.js';

const eventsService = new EventsService();

export const getEvents = async (req, res, next) => {
    try {
        const {
            status,
            category,
            location,
            organizer,
            dateFrom,
            dateTo,
            page = 1,
            limit = 10,
            sort = 'date'
        } = req.query;

        const filters = {};

        if (status) {
            filters.status = status;
        }

        if (category) {
            filters.category = category;
        }

        if (location) {
            filters.location = location;
        }

        if (organizer) {
            filters.organizer = organizer;
        }

        if (dateFrom || dateTo) {
            filters.date = {};

            if (dateFrom) {
                filters.date.$gte = new Date(dateFrom);
            }

            if (dateTo) {
                filters.date.$lte = new Date(dateTo);
            }
        }

        const result = await eventsService.getAllEvents(
            filters,
            {
                page,
                limit,
                sort
            }
        );

        res.status(200).json({
            status: 'success',
            data: result.events.map(
                event => new EventDTO(event)
            ),
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
        });
    } catch (error) {
        next(error);
    }
};
export const getEventById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const event = await eventsService.getEventById(id);

        res.status(200).json({
            status: 'success',
            payload: new EventDTO(event)
        });
    } catch (error) {
        next(error);
    }
};

export const createEvent = async (req, res, next) => {
    try {
        const {
            title,
            description,
            category,
            date,
            location,
            capacity,
            price
        } = req.body;

        const event = await eventsService.createEvent({
            title,
            description,
            category,
            date,
            location,
            capacity,
            price,
            organizer: req.user.id
        });

        res.status(201).json({
            status: 'success',
            payload: new EventDTO(event)
        });
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            title,
            description,
            category,
            date,
            location,
            capacity,
            price
        } = req.body;

        const updatedEvent = await eventsService.updateEvent(
            id,
            {
                title,
                description,
                category,
                date,
                location,
                capacity,
                price
            },
            req.user
        );

        res.status(200).json({
            status: 'success',
            payload: new EventDTO(updatedEvent)
        });
    } catch (error) {
        next(error);
    }
};

export const updateEventStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedEvent =
            await eventsService.updateEventStatus(
                id,
                status,
                req.user
            );

        res.status(200).json({
            status: 'success',
            payload: new EventDTO(updatedEvent)
        });
    } catch (error) {
        next(error);
    }
};
