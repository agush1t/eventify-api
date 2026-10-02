import TicketsService from '../services/tickets.service.js';
import generateError from '../utils/generateError.js';

const ticketsService = new TicketsService();

export const createTicket = async (req, res, next) => {
    try {
        const { eid } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined) {
            throw generateError(
                'La cantidad es obligatoria',
                400
            );
        }

        const ticket = await ticketsService.createTicket(
            eid,
            req.user,
            quantity
        );

        res.status(201).json({
            status: 'success',
            payload: ticket
        });
    } catch (error) {
        next(error);
    }
};

export const getMyTickets = async (req, res, next) => {
    try {
        const tickets =
            await ticketsService.getMyTickets(
                req.user.id
            );

        res.status(200).json({
            status: 'success',
            payload: tickets
        });
    } catch (error) {
        next(error);
    }
};

export const getEventTickets = async (req, res, next) => {
    try {
        const { eid } = req.params;

        const tickets =
            await ticketsService.getEventTickets(
                eid,
                req.user
            );

        res.status(200).json({
            status: 'success',
            payload: tickets
        });
    } catch (error) {
        next(error);
    }
};

export const cancelTicket = async (req, res, next) => {
    try {
        const { tid } = req.params;

        const ticket =
            await ticketsService.cancelTicket(
                tid,
                req.user
            );

        res.status(200).json({
            status: 'success',
            payload: ticket
        });
    } catch (error) {
        next(error);
    }
};
