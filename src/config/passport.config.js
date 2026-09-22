import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import UsersRepository from '../repositories/users.repository.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import generateError from '../utils/generateError.js';
import config from './config.js';

const usersRepository = new UsersRepository();

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
                const { first_name, last_name } = req.body;

                if (!first_name || !last_name || !email || !password) {
                    throw generateError('Faltan campos obligatorios', 400);
                }

                const normalizedEmail = email.trim().toLowerCase();

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailRegex.test(normalizedEmail)) {
                    throw generateError(
                        'El email no tiene un formato válido',
                        400
                    );
                }

                if (password.length < 6) {
                    throw generateError(
                        'La contraseña debe tener al menos 6 caracteres',
                        400
                    );
                }

                const existingUser =
                    await usersRepository.findByEmail(normalizedEmail);

                if (existingUser) {
                    throw generateError(
                        'El email ya está registrado',
                        409
                    );
                }

                const hashedPassword = await createHash(password);

                const newUser = await usersRepository.create({
                    first_name: first_name.trim(),
                    last_name: last_name.trim(),
                    email: normalizedEmail,
                    password: hashedPassword,
                    role: 'user'
                });

                return done(null, newUser);
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
                    throw generateError('Credenciales inválidas', 401);
                }

                const normalizedEmail = email.trim().toLowerCase();

                const user =
                    await usersRepository.findByEmail(normalizedEmail);

                if (!user) {
                    throw generateError('Credenciales inválidas', 401);
                }

                const passwordIsValid = await isValidPassword(
                    password,
                    user.password
                );

                if (!passwordIsValid) {
                    throw generateError('Credenciales inválidas', 401);
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
    let token = null;

    if (req && req.cookies) {
        token = req.cookies.currentUser;
    }

    return token;
};

// ================================
// Estrategia current
// ================================

passport.use(
    'current',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
            secretOrKey: config.jwtSecret
        },
        async (payload, done) => {
            try {
                return done(null, payload);
            } catch (error) {
                return done(generateError('No autenticado', 401));
            }
        }
    )
);

export default passport;