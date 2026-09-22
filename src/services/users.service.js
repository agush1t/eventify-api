import UsersRepository from '../repositories/users.repository.js';

const usersRepository = new UsersRepository();

class UsersService {
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
