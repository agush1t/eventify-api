import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true
        },
        status: {
            type: String,
            enum: ['confirmed', 'pending', 'cancelled'],
            default: 'confirmed'
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: Number.isInteger
        },
        reservationCode: {
            type: String,
            required: true,
            unique: true
        },
        cancelledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

// Garantiza una sola inscripción activa por usuario y evento.
ticketSchema.index(
    { user: 1, event: 1 },
    { unique: true, partialFilterExpression: { status: { $in: ['confirmed', 'pending'] } } }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
