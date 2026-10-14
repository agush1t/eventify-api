import EventsService from '../services/events.service.js';
import EventDTO from '../dtos/event.dto.js';

const eventsService = new EventsService();

function queryOptions(query) {
    const { page = 1, limit = 10, sort = 'date', ...filters } = query;
    return { filters, options: { page, limit, sort } };
}

function sendEvents(res, result) {
    res.status(200).json({
        status: 'success',
        data: result.events.map(event => new EventDTO(event)),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
    });
}

export const getEvents = async (req, res, next) => {
    try {
        const { filters, options } = queryOptions(req.query);
        const result = await eventsService.getAllEvents(filters, options, { scope: 'public' });
        sendEvents(res, result);
    } catch (error) { next(error); }
};

export const getMyEvents = async (req, res, next) => {
    try {
        const { filters, options } = queryOptions(req.query);
        const result = await eventsService.getAllEvents(filters, options, { scope: 'mine', user: req.user });
        sendEvents(res, result);
    } catch (error) { next(error); }
};

export const getAdminEvents = async (req, res, next) => {
    try {
        const { filters, options } = queryOptions(req.query);
        const result = await eventsService.getAllEvents(filters, options, { scope: 'admin', user: req.user });
        sendEvents(res, result);
    } catch (error) { next(error); }
};

export const getEventById = async (req, res, next) => {
    try {
        const event = await eventsService.getEventById(req.params.id, { scope: 'public' });
        res.status(200).json({ status: 'success', payload: new EventDTO(event) });
    } catch (error) { next(error); }
};

export const getManagedEventById = async (req, res, next) => {
    try {
        const event = await eventsService.getEventById(req.params.id, { scope: 'managed', user: req.user });
        res.status(200).json({ status: 'success', payload: new EventDTO(event) });
    } catch (error) { next(error); }
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
