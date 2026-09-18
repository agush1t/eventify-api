import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import './config/passport.config.js';

import eventsRouter from './routes/events.router.js';
import sessionsRouter from './routes/sessions.router.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Servidor activo'
    });
});

app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);

app.use(errorHandler);

export default app;