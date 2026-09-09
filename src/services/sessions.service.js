import UsersRepository from '../repositories/users.repository.js';

import { createHash, isValidPassword } from '../utils/hash.js';

import generateError from '../utils/generateError.js';

const usersRepository = new UsersRepository();

class SessionsService {

    async registerUser({ first_name, last_name, email, password }) {

        if (!first_name || !last_name || !email || !password) {

            throw generateError('Faltan campos obligatorios', 400);

        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {

            throw generateError('El email no tiene un formato válido', 400);

        }

        if (password.length < 6) {

            throw generateError(
                'La contraseña debe tener al menos 6 caracteres',
                400
            );

        }

        const existingUser = await usersRepository.findByEmail(normalizedEmail);

        if (existingUser) {

            throw generateError('El email ya está registrado', 409);

        }

        const hashedPassword = await createHash(password);

        const newUser = await usersRepository.create({

            first_name: first_name.trim(),

            last_name: last_name.trim(),

            email: normalizedEmail,

            password: hashedPassword

        });

        return newUser;

    }

    async loginUser({ email, password }) {

        if (!email || !password) {

            throw generateError('Credenciales inválidas', 401);

        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await usersRepository.findByEmail(normalizedEmail);

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

        return user;

    }

}

export default SessionsService;