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
    async getAllEvents(filters = {}, options = {}, access = { scope: 'public' }) {
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

        const normalizedFilters = this.normalizeFilters(filters, access);
        const result = await eventsRepository.getAll(
            normalizedFilters,
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

    normalizeFilters(filters, access) {
        const allowed = ['status', 'category', 'location', 'organizer', 'dateFrom', 'dateTo'];
        if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
            throw generateError('Filtros inválidos', 400);
        }
        for (const [key, value] of Object.entries(filters)) {
            if (!allowed.includes(key) || typeof value !== 'string' || !value.trim()) {
                throw generateError(`Filtro inválido: ${key}`, 400);
            }
        }
        const query = {};
        if (filters.status) {
            if (!ALLOWED_STATUSES.includes(filters.status)) throw generateError('Estado de evento no válido', 400);
            query.status = filters.status;
        }
        for (const key of ['category', 'location']) {
            if (filters[key]) query[key] = filters[key].trim();
        }
        if (filters.organizer) {
            if (!mongoose.isObjectIdOrHexString(filters.organizer)) throw generateError('Organizador inválido', 400);
            query.organizer = filters.organizer;
        }
        const parseDate = (value, field) => {
            if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value)) {
                throw generateError(`${field} debe ser una fecha ISO válida`, 400);
            }
            const date = new Date(value);
            if (Number.isNaN(date.getTime()) || (value.length === 10 && date.toISOString().slice(0, 10) !== value)) {
                throw generateError(`${field} no es una fecha válida`, 400);
            }
            return date;
        };
        if (filters.dateFrom || filters.dateTo) {
            query.date = {};
            if (filters.dateFrom) query.date.$gte = parseDate(filters.dateFrom, 'dateFrom');
            if (filters.dateTo) query.date.$lte = parseDate(filters.dateTo, 'dateTo');
            if (query.date.$gte && query.date.$lte && query.date.$gte > query.date.$lte) {
                throw generateError('dateFrom no puede ser posterior a dateTo', 400);
            }
        }
        if (access.scope === 'public') {
            if (filters.status && filters.status !== 'published') {
                throw generateError('El catálogo público solo admite eventos publicados', 400);
            }
            query.status = 'published';
        } else if (access.scope === 'mine') {
            if (!access.user || !['organizer', 'admin'].includes(access.user.role)) throw generateError('No autorizado', 403);
            if (filters.organizer && filters.organizer !== access.user.id.toString()) {
                throw generateError('No podés consultar eventos de otro organizador', 403);
            }
            query.organizer = access.user.id;
        } else if (access.scope === 'admin') {
            if (access.user?.role !== 'admin') throw generateError('No autorizado', 403);
        } else {
            throw generateError('Tipo de consulta no permitido', 400);
        }
        return query;
    }

    async getEventById(id, access = { scope: 'public' }) {
        if (!mongoose.isObjectIdOrHexString(id)) throw generateError('Identificador de evento inválido', 400);
        const event = await eventsRepository.getById(id);
        if (!event) throw generateError('Evento no encontrado', 404);
        if (access.scope === 'public' && event.status !== 'published') {
            throw generateError('Evento no encontrado', 404);
        }
        if (access.scope === 'managed') {
            if (!access.user || !['organizer', 'admin'].includes(access.user.role)) throw generateError('No autorizado', 403);
            if (access.user.role !== 'admin' && event.organizer.toString() !== access.user.id.toString()) {
                throw generateError('No tenés permisos para consultar este evento', 403);
            }
        } else if (access.scope !== 'public') {
            throw generateError('Tipo de consulta no permitido', 400);
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
