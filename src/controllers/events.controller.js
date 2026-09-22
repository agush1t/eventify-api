import EventsService from '../services/events.service.js';
import generateError from '../utils/generateError.js';

const eventsService = new EventsService();

export const getEvents = async (req, res, next) => {
    try {
        const events = await eventsService.getAllEvents();

        res.status(200).json({
            status: 'success',
            payload: events
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
            date,
            location,
            capacity
        } = req.body;

        if (
            !title ||
            !description ||
            !date ||
            !location ||
            !capacity
        ) {
            throw generateError(
                'Todos los campos del evento son obligatorios',
                400
            );
        }

        const event = await eventsService.createEvent({
            title,
            description,
            date,
            location,
            capacity,
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
            date,
            location,
            capacity
        } = req.body;

        const event = await eventsService.getEventById(id);

        if (!event) {
            throw generateError('Evento no encontrado', 404);
        }

        if (
            req.user.role === 'organizer' &&
            event.organizer !== req.user.id
        ) {
            throw generateError(
                'No tenés permisos para modificar este evento',
                403
            );
        }

        const updatedEvent = await eventsService.updateEvent(id, {
            title,
            description,
            date,
            location,
            capacity
        });

        res.status(200).json({
            status: 'success',
            payload: updatedEvent
        });
    } catch (error) {
        next(error);
    }
};
