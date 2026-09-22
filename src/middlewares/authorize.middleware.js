import generateError from '../utils/generateError.js';

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(generateError('No autenticado', 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                generateError(
                    'No tenés permisos para realizar esta acción',
                    403
                )
            );
        }

        next();
    };
};

export default authorize;
