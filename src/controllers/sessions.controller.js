import SessionsService from '../services/sessions.service.js';

const sessionsService = new SessionsService();

export const getSessions = (req, res) => {
    res.status(200).json({
        status: 'success',
        payload: []
    });
};

export const register = async (req, res, next) => {
    try {
        const user = await sessionsService.registerUser(req.body);

        res.status(201).json({
            status: 'success',
            payload: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};