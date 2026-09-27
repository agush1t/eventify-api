import EventsRepository from '../repositories/events.repository.js';
import generateError from '../utils/generateError.js';

const eventsRepository = new EventsRepository();

const ALLOWED_STATUSES = [
    'draft',
    'published',
    'cancelled',
    'finished'
];

class EventsService {
    async getAllEvents(filters = {}, options = {}) {
        return await eventsRepository.getAll(filters, options);
    }

    async getEventById(id) {
        return await eventsRepository.getById(id);
    }

    async createEvent(eventData) {
        const {
            title,
            description,
            category,
            date,
            location,
            capacity,
            price,
            organizer
        } = eventData;

        if (
            !title ||
            !description ||
            !category ||
            !date ||
            !location ||
            capacity === undefined ||
            price === undefined
        ) {
            throw generateError(
                'Todos los campos obligatorios del evento deben estar completos',
                400
            );
        }

        const eventDate = new Date(date);

        if (Number.isNaN(eventDate.getTime())) {
            throw generateError(
                'La fecha del evento no es válida',
                400
            );
        }

        if (eventDate <= new Date()) {
            throw generateError(
                'La fecha del evento debe ser futura',
                400
            );
        }

        if (capacity <= 0) {
            throw generateError(
                'La capacidad debe ser mayor a 0',
                400
            );
        }

        if (price < 0) {
            throw generateError(
                'El precio no puede ser negativo',
                400
            );
        }

        return await eventsRepository.create({
            title,
            description,
            category,
            date: eventDate,
            location,
            capacity,
            price,
            status: 'draft',
            organizer
        });
    }

    async updateEvent(id, eventData, user) {
        const event = await eventsRepository.getById(id);

        if (!event) {
            throw generateError('Evento no encontrado', 404);
        }

        if (event.status === 'cancelled') {
            throw generateError(
                'Los eventos cancelados no pueden modificarse',
                400
            );
        }

        const isOwner =
            event.organizer.toString() === user.id.toString();

        if (user.role !== 'admin' && !isOwner) {
            throw generateError(
                'No tenés permisos para modificar este evento',
                403
            );
        }

        if (eventData.date !== undefined) {
            const eventDate = new Date(eventData.date);

            if (Number.isNaN(eventDate.getTime())) {
                throw generateError(
                    'La fecha del evento no es válida',
                    400
                );
            }

            if (eventDate <= new Date()) {
                throw generateError(
                    'La fecha del evento debe ser futura',
                    400
                );
            }

            eventData.date = eventDate;
        }

        if (
            eventData.capacity !== undefined &&
            eventData.capacity <= 0
        ) {
            throw generateError(
                'La capacidad debe ser mayor a 0',
                400
            );
        }

        if (
            eventData.price !== undefined &&
            eventData.price < 0
        ) {
            throw generateError(
                'El precio no puede ser negativo',
                400
            );
        }

        return await eventsRepository.update(id, eventData);
    }

    async updateEventStatus(id, status, user) {
        if (!ALLOWED_STATUSES.includes(status)) {
            throw generateError(
                'Estado de evento no válido',
                400
            );
        }

        const event = await eventsRepository.getById(id);

        if (!event) {
            throw generateError('Evento no encontrado', 404);
        }

        const isOwner =
            event.organizer.toString() === user.id.toString();

        if (user.role !== 'admin' && !isOwner) {
            throw generateError(
                'No tenés permisos para modificar este evento',
                403
            );
        }

        if (
            status === 'published' &&
            ['cancelled', 'finished'].includes(event.status)
        ) {
            throw generateError(
                'No se puede publicar un evento cancelado o finalizado',
                400
            );
        }

        if (
            event.status === 'cancelled' &&
            status !== 'cancelled'
        ) {
            throw generateError(
                'Un evento cancelado no puede cambiar de estado',
                400
            );
        }

        return await eventsRepository.update(id, { status });
    }
}

export default EventsService;
