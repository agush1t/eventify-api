import { Router } from 'express';

import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    updateEventStatus
} from '../controllers/events.controller.js';

import auth from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/authorize.middleware.js';

const router = Router();

// Público
router.get('/', getEvents);

router.get('/:id', getEventById);

// Crear: organizer o admin
router.post(
    '/',
    auth,
    authorize('organizer', 'admin'),
    createEvent
);

// Modificar: organizer o admin
// El Service valida la propiedad del evento
router.put(
    '/:id',
    auth,
    authorize('organizer', 'admin'),
    updateEvent
);

// Cambiar estado: organizer o admin
// El Service valida la propiedad del evento
router.patch(
    '/:id/status',
    auth,
    authorize('organizer', 'admin'),
    updateEventStatus
);

export default router;
