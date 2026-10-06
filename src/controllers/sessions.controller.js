import { generateToken } from '../utils/jwt.js';
import UserDTO from '../dtos/user.dto.js';

export const getSessions = (req, res) => {
    res.status(200).json({
        status: 'success',
        payload: []
    });
};

export const register = (req, res) => {
    const user = req.user;

    res.status(201).json({
        status: 'success',
        payload: new UserDTO(user)
    });
};

export const login = (req, res) => {
    const user = req.user;

    const token = generateToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role
    });

    res.cookie('currentUser', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 3600000,
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
        status: 'success',
        message: 'Login correcto'
    });
};

export const current = (req, res) => {
    res.status(200).json({
        status: 'success',
        payload: new UserDTO(req.user)
    });
};

export const logout = (req, res) => {
    res.clearCookie('currentUser', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
        status: 'success',
        message: 'SesiÃ³n cerrada'
    });
};
