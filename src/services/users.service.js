import UsersRepository from '../repositories/users.repository.js';
import { createHash } from '../utils/hash.js';
import generateError from '../utils/generateError.js';

const usersRepository = new UsersRepository();

class UsersService {
    async registerUser(userData) {
        const {
            first_name,
            last_name,
            email,
            password
        } = userData;

        if (
            !first_name?.trim() ||
            !last_name?.trim() ||
            !email?.trim() ||
            !password
        ) {
            throw generateError(
                'Faltan campos obligatorios',
                400
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            throw generateError(
                'El email no tiene un formato válido',
                400
            );
        }

        if (typeof password !== 'string' || password.length < 6) {
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

        return await usersRepository.create({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user'
        });
    }

    async findByEmail(email) {
        return await usersRepository.findByEmail(email);
    }

    async createUser(userData) {
        return await usersRepository.create(userData);
    }

    async getAllUsers() {
        return await usersRepository.findAll();
    }
}

export default UsersService;