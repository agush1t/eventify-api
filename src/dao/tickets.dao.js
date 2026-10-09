import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

class TicketsDAO {
    async create(ticketData) {
        return await Ticket.create(ticketData);
    }

    async getById(id) {
        return await Ticket.findById(id);
    }

    async getByUser(userId) {
        return await Ticket.find({ user: userId })
            .populate('event', 'title date location')
            .sort({ createdAt: -1 });
    }

    async getByEvent(eventId) {
        return await Ticket.find({ event: eventId })
            .populate('user', 'first_name last_name email')
            .sort({ createdAt: -1 });
    }

    async findActiveByUserAndEvent(userId, eventId) {
        return await Ticket.findOne({
            user: userId,
            event: eventId,
            status: {
                $in: ['confirmed', 'pending']
            }
        });
    }

    async getActiveQuantityByEvent(eventId) {
        const result = await Ticket.aggregate([
            {
                $match: {
                    event: new mongoose.Types.ObjectId(eventId),
                    status: {
                        $in: ['confirmed', 'pending']
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalQuantity: {
                        $sum: '$quantity'
                    }
                }
            }
        ]);

        return result.length > 0
            ? result[0].totalQuantity
            : 0;
    }

    async update(id, ticketData) {
        return await Ticket.findByIdAndUpdate(
            id,
            ticketData,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );
    }
}

export default TicketsDAO;
