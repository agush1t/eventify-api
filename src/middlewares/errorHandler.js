import config from '../config/config.js';

const errorHandler = (error, req, res, next) => {
    let statusCode =
        Number.isInteger(error.statusCode) &&
        error.statusCode >= 400 &&
        error.statusCode <= 599
            ? error.statusCode
            : 500;

    let message = error.message || 'Error interno del servidor';

    if (error.name === 'CastError' || error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Los datos enviados no son válidos';
    } else if (error.code === 11000) {
        statusCode = 409;
        message = 'Ya existe un registro con esos datos';
    }

    if (statusCode >= 500) {
        console.error(error);
    }

    if (statusCode === 500 && config.nodeEnv === 'production') {
        message = 'Error interno del servidor';
    }

    res.status(statusCode).json({
        status: 'error',
        message
    });
};

export default errorHandler;
