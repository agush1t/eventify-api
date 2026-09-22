import passport from 'passport';
import generateError from '../utils/generateError.js';

const auth = (req, res, next) => {
    passport.authenticate(
        'current',
        { session: false },
        (error, user) => {
            if (error || !user) {
                return next(generateError('No autenticado', 401));
            }

            req.user = user;

            next();
        }
    )(req, res, next);
};

export default auth;
