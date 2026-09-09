import { verifyToken } from '../utils/jwt.js';
import generateError from '../utils/generateError.js';

const auth = (req, res, next) => {
    try {
        const token = req.cookies.currentUser;

        if (!token) {
            throw generateError('No autenticado', 401);
        }

        const payload = verifyToken(token);

        req.user = payload;

        next();
    } catch (error) {
        if (error.statusCode === 401) {
            return next(error);
        }

        next(generateError('No autenticado', 401));
    }
};

export default auth;