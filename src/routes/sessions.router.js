import { Router } from 'express';
import passport from 'passport';

import {
    getSessions,
    register,
    login,
    current,
    logout
} from '../controllers/sessions.controller.js';

const router = Router();

router.get('/', getSessions);

router.post(
    '/register',
    passport.authenticate('register', { session: false }),
    register
);

router.post(
    '/login',
    passport.authenticate('login', { session: false }),
    login
);

router.get(
    '/current',
    passport.authenticate('current', { session: false }),
    current
);

router.post('/logout', logout);

export default router;