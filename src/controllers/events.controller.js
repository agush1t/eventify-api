import EventsService from '../services/events.service.js';
import generateError from '../utils/generateError.js';

const eventsService = new EventsService();

export const getEvents = async (req, res, next) => {
    try {
        const {
            status,
            category,
            location,
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

        if (dateFrom || dateTo) {
            filters.date = {};

            if (dateFrom) {
                filters.date.$gte = new Date(dateFrom);
            }

            if (dateTo) {
                filters.date.$lte = new Date(dateTo);
            }
        }

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1
        ) {
            throw generateError(
                'El parámetro page debe ser un número entero mayor a 0',
                400
            );
        }

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1
        ) {
            throw generateError(
                'El parámetro limit debe ser un número entero mayor a 0',
                400
            );
        }

        const result = await eventsService.getAllEvents(
            filters,
            {
                page: pageNumber,
                limit: limitNumber,
                sort
            }
        );

        const totalPages = Math.ceil(
            result.total / limitNumber
        );

        res.status(200).json({
            status: 'success',
            data: result.events,
            page: pageNumber,
            limit: limitNumber,
            total: result.total,
            totalPages
        });
    } catch (error) {
        next(error);
    }
};

export const getEventById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const event = await eventsService.getEventById(id);

        if (!event) {
            throw generateError(
                'Evento no encontrado',
                404
            );
        }

        res.status(200).json({
            status: 'success',
            payload: event
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
            payload: event
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
            payload: updatedEvent
        });
    } catch (error) {
        next(error);
    }
};

export const updateEventStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            throw generateError(
                'El estado es obligatorio',
                400
            );
        }

        const updatedEvent =
            await eventsService.updateEventStatus(
                id,
                status,
                req.user
            );

        res.status(200).json({
            status: 'success',
            payload: updatedEvent
        });
    } catch (error) {
        next(error);
    }
};
