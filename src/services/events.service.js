import EventsRepository from '../repositories/events.repository.js';
import generateError from '../utils/generateError.js';

const eventsRepository = new EventsRepository();

const ALLOWED_STATUSES = [
    'draft',
    'published',
    'cancelled',
    'finished'
];

const ALLOWED_SORT_FIELDS = [
    'date',
    'title',
    'price'
];

class EventsService {
    async getAllEvents(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = 'date'
        } = options;

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

        if (typeof sort !== 'string' || !sort.trim()) {
            throw generateError(
                'El campo de ordenamiento no es válido',
                400
            );
        }

        const sortField = sort.startsWith('-')
            ? sort.substring(1)
            : sort;

        if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
            throw generateError(
                'Campo de ordenamiento no permitido: ' + sortField,
                400
            );
        }

        const result = await eventsRepository.getAll(
            filters,
            {
                page: pageNumber,
                limit: limitNumber,
                sort
            }
        );

        return {
            events: result.events,
            total: result.total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(
                result.total / limitNumber
            )
        };
    }

    async getEventById(id) {
        const event = await eventsRepository.getById(id);

        if (!event) {
            throw generateError(
                'Evento no encontrado',
                404
            );
        }

        return event;
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
            capacity === null ||
            price === undefined ||
            price === null
        ) {
            throw generateError(
                'Todos los campos obligatorios del evento deben estar completos',
                400
            );
        }

        if (
            typeof capacity !== 'number' ||
            !Number.isFinite(capacity) ||
            !Number.isInteger(capacity) ||
            capacity < 1
        ) {
            throw generateError(
                'La capacidad debe ser un número entero mayor a 0',
                400
            );
        }

        if (
            typeof price !== 'number' ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            throw generateError(
                'El precio debe ser un número válido mayor o igual a 0',
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
            throw generateError(
                'Evento no encontrado',
                404
            );
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

        if (eventData.capacity !== undefined) {
            if (
                typeof eventData.capacity !== 'number' ||
                !Number.isFinite(eventData.capacity) ||
                !Number.isInteger(eventData.capacity) ||
                eventData.capacity < 1
            ) {
                throw generateError(
                    'La capacidad debe ser un número entero mayor a 0',
                    400
                );
            }
        }

        if (eventData.price !== undefined) {
            if (
                typeof eventData.price !== 'number' ||
                !Number.isFinite(eventData.price) ||
                eventData.price < 0
            ) {
                throw generateError(
                    'El precio debe ser un número válido mayor o igual a 0',
                    400
                );
            }
        }

        return await eventsRepository.update(id, eventData);
    }

    async updateEventStatus(id, status, user) {
        if (!status) {
            throw generateError(
                'El estado es obligatorio',
                400
            );
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            throw generateError(
                'Estado de evento no válido',
                400
            );
        }

        const event = await eventsRepository.getById(id);

        if (!event) {
            throw generateError(
                'Evento no encontrado',
                404
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
