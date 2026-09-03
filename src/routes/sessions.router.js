import { Router } from 'express';
import { getSessions } from '../controllers/sessions.controller.js';

const router = Router();

router.get('/', getSessions);

export default router;
