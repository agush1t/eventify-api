import { Router } from 'express';
import { getSessions, register } from '../controllers/sessions.controller.js';

const router = Router();

router.get('/', getSessions);
router.post('/register', register);

export default router;
