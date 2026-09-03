import express from 'express';
import dotenv from 'dotenv';

import eventsRouter from './routes/events.router.js';
import sessionsRouter from './routes/sessions.router.js';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Servidor activo'
    });
});

app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);

export default app;
