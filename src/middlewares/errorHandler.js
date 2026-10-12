
import config from '../config/config.js';

const errorHandler = (error, req, res, next) => {
    console.error(error);

    const statusCode =
        Number.isInteger(error.statusCode) &&
        error.statusCode >= 400 &&
        error.statusCode <= 599
            ? error.statusCode
            : 500;

    const message =
        statusCode === 500 && config.nodeEnv === 'production'
            ? 'Error interno del servidor'
            : error.message || 'Error interno del servidor';

    res.status(statusCode).json({
        status: 'error',
        message
    });
};

export default errorHandler;
