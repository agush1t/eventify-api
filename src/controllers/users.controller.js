import UsersService from '../services/users.service.js';

const usersService = new UsersService();

export const getUsers = async (req, res, next) => {
    try {
        const users = await usersService.getAllUsers();

        res.status(200).json({
            status: 'success',
            payload: users
        });
    } catch (error) {
        next(error);
    }
};
