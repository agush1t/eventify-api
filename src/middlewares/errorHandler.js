const errorHandler = (error, req, res, next) => {
    console.error(error);

    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Error interno del servidor'
    });
};

export default errorHandler;