import nodemailer from 'nodemailer';
import config from '../config/config.js';

const transporter = nodemailer.createTransport(
    config.nodeEnv === 'test'
        ? {
            jsonTransport: true
        }
        : {
            host: config.mailHost,
            port: Number(config.mailPort),
            secure: Number(config.mailPort) === 465,
            auth: {
                user: config.mailUser,
                pass: config.mailPass
            }
        }
);

const escapeHtml = (value) => {
    return String(value ?? '').replace(/[&<>"']/g, (character) => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return entities[character];
    });
};

export const sendTicketConfirmationEmail = async ({
    to,
    event,
    ticket
}) => {
    const title = escapeHtml(event.title);
    const date = escapeHtml(new Date(event.date).toLocaleString('es-AR'));
    const location = escapeHtml(event.location);
    const quantity = escapeHtml(ticket.quantity);
    const reservationCode = escapeHtml(ticket.reservationCode);

    return await transporter.sendMail({
        from: config.mailFrom || 'no-reply@eventify.test',
        to,
        subject: `Inscripción confirmada: ${event.title}`,
        text: `
Hola.

Tu inscripción al evento "${event.title}" fue confirmada.

Fecha: ${new Date(event.date).toLocaleString('es-AR')}
Lugar: ${event.location}
Cantidad de entradas: ${ticket.quantity}
Código de reserva: ${ticket.reservationCode}

¡Te esperamos!
        `,
        html: `
            <h2>Inscripción confirmada</h2>

            <p>
                Tu inscripción al evento
                <strong>${title}</strong>
                fue confirmada correctamente.
            </p>

            <p><strong>Fecha:</strong> ${date}</p>
            <p><strong>Lugar:</strong> ${location}</p>
            <p><strong>Cantidad de entradas:</strong> ${quantity}</p>
            <p><strong>Código de reserva:</strong> ${reservationCode}</p>

            <p>¡Te esperamos!</p>
        `
    });
};

export const sendTicketCancellationEmail = async ({
    to,
    event,
    ticket
}) => {
    const title = escapeHtml(event.title);
    const date = escapeHtml(new Date(event.date).toLocaleString('es-AR'));
    const location = escapeHtml(event.location);
    const quantity = escapeHtml(ticket.quantity);
    const reservationCode = escapeHtml(ticket.reservationCode);

    return await transporter.sendMail({
        from: config.mailFrom || 'no-reply@eventify.test',
        to,
        subject: `Cancelación de inscripción: ${event.title}`,
        text: `
Hola.

Tu inscripción al evento "${event.title}" fue cancelada correctamente.

Fecha: ${new Date(event.date).toLocaleString('es-AR')}
Lugar: ${event.location}
Cantidad de entradas: ${ticket.quantity}
Código de reserva: ${ticket.reservationCode}

Si no realizaste esta cancelación, por favor contactá al administrador.
        `,
        html: `
            <h2>Inscripción cancelada</h2>

            <p>
                Tu inscripción al evento
                <strong>${title}</strong>
                fue cancelada correctamente.
            </p>

            <p><strong>Fecha:</strong> ${date}</p>
            <p><strong>Lugar:</strong> ${location}</p>
            <p><strong>Cantidad de entradas:</strong> ${quantity}</p>
            <p><strong>Código de reserva:</strong> ${reservationCode}</p>

            <p>
                Si no realizaste esta cancelación, por favor contactá al administrador.
            </p>
        `
    });
};
