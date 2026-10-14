import mongoose from 'mongoose';
import EventsRepository from '../repositories/events.repository.js';
import TicketsRepository from '../repositories/tickets.repository.js';
import generateError from '../utils/generateError.js';

const eventsRepository = new EventsRepository();
const ticketsRepository = new TicketsRepository();
const STATUS_TRANSITIONS = {
    draft: ['published', 'cancelled'],
    published: ['finished', 'cancelled'],
    cancelled: [],
    finished: []
};

function checkOwner(event, user) {
    if (user.role !== 'admin' && event.organizer.toString() !== user.id.toString()) {
        throw generateError('No tenés permisos para modificar este evento', 403);
    }
}

function validateTextFields(data, required = false) {
    for (const field of ['title', 'description', 'category', 'location']) {
        const value = data[field];
        if (required || value !== undefined) {
            if (typeof value !== 'string' || !value.trim()) {
                throw generateError(`El campo ${field} debe ser texto no vacío`, 400);
            }
            data[field] = value.trim();
        }
    }
}


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

        if (limitNumber > 100) {
            throw generateError('El parámetro limit no puede superar 100', 400);
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

        const normalized = { title, description, category, location };
        validateTextFields(normalized, true);

        return await eventsRepository.create({
            ...normalized,
            date: eventDate,
            capacity,
            price,
            status: 'draft',
            organizer
        });
    }

    async updateEvent(id, eventData, user) {
        const updates = { ...eventData };
        validateTextFields(updates);

        if (updates.date !== undefined) {
            const date = new Date(updates.date);
            if (Number.isNaN(date.getTime()) || date <= new Date()) {
                throw generateError('La fecha del evento debe ser válida y futura', 400);
            }
            updates.date = date;
        }
        if (updates.capacity !== undefined && (
            typeof updates.capacity !== 'number' ||
            !Number.isInteger(updates.capacity) || updates.capacity < 1
        )) {
            throw generateError('La capacidad debe ser un número entero mayor a 0', 400);
        }
        if (updates.price !== undefined && (
            typeof updates.price !== 'number' ||
            !Number.isFinite(updates.price) || updates.price < 0
        )) {
            throw generateError('El precio debe ser un número válido mayor o igual a 0', 400);
        }

        const session = await mongoose.startSession();
        try {
            let updated;
            await session.withTransaction(async () => {
                // Escribir primero sobre el evento: reservas y cancelaciones usan el mismo documento.
                const event = await eventsRepository.touchForCancellation(id, session);
                if (!event) throw generateError('Evento no encontrado', 404);
                checkOwner(event, user);
                if (['cancelled', 'finished'].includes(event.status)) {
                    throw generateError('Los eventos cancelados o finalizados no pueden modificarse', 400);
                }
                if (updates.capacity !== undefined) {
                    const occupied = await ticketsRepository.getActiveQuantityByEvent(id, session);
                    if (updates.capacity < occupied) {
                        throw generateError(`La capacidad no puede ser menor que los ${occupied} cupos reservados`, 409);
                    }
                }
                updated = await eventsRepository.update(id, updates, session);
            });
            return updated;
        } finally {
            await session.endSession();
        }
    }

    async updateEventStatus(id, status, user) {
        if (!ALLOWED_STATUSES.includes(status)) {
            throw generateError('Estado de evento no válido', 400);
        }
        const session = await mongoose.startSession();
        try {
            let updated;
            await session.withTransaction(async () => {
                const event = await eventsRepository.touchForCancellation(id, session);
                if (!event) throw generateError('Evento no encontrado', 404);
                checkOwner(event, user);
                if (status === event.status) {
                    updated = event;
                    return;
                }
                if (!STATUS_TRANSITIONS[event.status]?.includes(status)) {
                    throw generateError(`No se permite cambiar de ${event.status} a ${status}`, 400);
                }
                if (status === 'published' && event.date <= new Date()) {
                    throw generateError('No se puede publicar un evento con fecha pasada', 400);
                }
                if (status === 'finished' && event.date > new Date()) {
                    throw generateError('No se puede finalizar un evento antes de su fecha', 400);
                }
                updated = await eventsRepository.update(id, { status }, session);
            });
            return updated;
        } finally {
            await session.endSession();
        }
    }
}

export default EventsService;
