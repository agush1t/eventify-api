import { Router } from 'express';

import {
    createTicket,
    getMyTickets,
    getEventTickets,
    cancelTicket
} from '../controllers/tickets.controller.js';

import auth from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/authorize.middleware.js';

const router = Router();

// Inscribirse a un evento
// Cualquier usuario autenticado
router.post(
    '/events/:eid/tickets',
    auth,
    createTicket
);

// Ver mis tickets
// Cualquier usuario autenticado
router.get(
    '/tickets/my-tickets',
    auth,
    getMyTickets
);

// Ver tickets de un evento
// Solo organizer o admin
// El Service verifica que el organizer sea dueño del evento
router.get(
    '/events/:eid/tickets',
    auth,
    authorize('organizer', 'admin'),
    getEventTickets
);

// Cancelar ticket
// El Service verifica que sea el dueño o admin
router.patch(
    '/tickets/:tid/cancel',
    auth,
    cancelTicket
);

export default router;
