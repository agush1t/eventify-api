import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

class TicketsDAO {
    async create(ticketData, session) {
        const [ticket] = await Ticket.create([ticketData], { session });
        return ticket;
    }

    async getById(id, session) {
        return await Ticket.findById(id)
            .session(session)
            .populate('user', 'first_name last_name email');
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

    async findActiveByUserAndEvent(userId, eventId, session) {
        return await Ticket.findOne({
            user: userId,
            event: eventId,
            status: {
                $in: ['confirmed', 'pending']
            }
        }).session(session);
    }

    async getActiveQuantityByEvent(eventId, session) {
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
        ]).session(session);

        return result.length > 0
            ? result[0].totalQuantity
            : 0;
    }

    async cancelIfActive(id, session) {
        return await Ticket.findOneAndUpdate(
            { _id: id, status: { $in: ['confirmed', 'pending'] } },
            { $set: { status: 'cancelled', cancelledAt: new Date() } },
            { returnDocument: 'after', runValidators: true, session }
        );
    }

    async update(id, ticketData, session) {
        return await Ticket.findByIdAndUpdate(
            id,
            ticketData,
            {
                returnDocument: 'after',
                runValidators: true,
                session
            }
        );
    }
}

export default TicketsDAO;
