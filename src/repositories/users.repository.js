import UsersDAO from '../dao/users.dao.js';

const usersDAO = new UsersDAO();

class UsersRepository {
    async findByEmail(email) {
        return await usersDAO.findByEmail(email);
    }

    async create(userData) {
        return await usersDAO.create(userData);
    }

    async findAll() {
        return await usersDAO.findAll();
    }
}

export default UsersRepository;
