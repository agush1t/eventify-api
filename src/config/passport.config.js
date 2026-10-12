import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import UsersService from '../services/users.service.js';
import { isValidPassword } from '../utils/hash.js';
import generateError from '../utils/generateError.js';
import config from './config.js';

const usersService = new UsersService();

// ================================
// Estrategia de registro
// ================================

passport.use(
    'register',
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        async (req, email, password, done) => {
            try {
                const user = await usersService.registerUser({
                    ...req.body,
                    email,
                    password
                });

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

// ================================
// Estrategia de login
// ================================

passport.use(
    'login',
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                if (!email || !password) {
                    throw generateError(
                        'Credenciales inválidas',
                        401
                    );
                }

                const normalizedEmail = email.trim().toLowerCase();

                const user =
                    await usersService.findByEmail(normalizedEmail);

                if (!user) {
                    throw generateError(
                        'Credenciales inválidas',
                        401
                    );
                }

                const passwordIsValid = await isValidPassword(
                    password,
                    user.password
                );

                if (!passwordIsValid) {
                    throw generateError(
                        'Credenciales inválidas',
                        401
                    );
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

// ================================
// Extractor del JWT desde la cookie
// ================================

const cookieExtractor = (req) => {
    if (req?.cookies?.currentUser) {
        return req.cookies.currentUser;
    }

    return null;
};

// ================================
// Estrategia current
// ================================

passport.use(
    'current',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromExtractors([
                cookieExtractor
            ]),
            secretOrKey: config.jwtSecret
        },
        async (payload, done) => {
            try {
                if (!payload?.id) {
                    return done(
                        generateError('No autenticado', 401),
                        false
                    );
                }

                const user = await usersService.findById(payload.id);

                if (!user) {
                    return done(
                        generateError('No autenticado', 401),
                        false
                    );
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

export default passport;
