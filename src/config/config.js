import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: Number(process.env.PORT) || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUrl: process.env.MONGO_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

    mailHost: process.env.MAIL_HOST,
    mailPort: process.env.MAIL_PORT,
    mailUser: process.env.MAIL_USER,
    mailPass: process.env.MAIL_PASS,
    mailFrom: process.env.MAIL_FROM
};

export const validateConfig = () => {
    const errors = [];

    if (
        !Number.isInteger(config.port) ||
        config.port < 1 ||
        config.port > 65535
    ) {
        errors.push('PORT debe ser un número entero entre 1 y 65535.');
    }

    if (!config.mongoUrl) {
        errors.push('Falta configurar la variable MONGO_URL.');
    }

    if (!config.jwtSecret) {
        errors.push('Falta configurar la variable JWT_SECRET.');
    } else if (
        config.nodeEnv === 'production' &&
        config.jwtSecret.length < 32
    ) {
        errors.push(
            'En producción, JWT_SECRET debe tener al menos 32 caracteres.'
        );
    }

    const mailVariables = [
        config.mailHost,
        config.mailPort,
        config.mailUser,
        config.mailPass,
        config.mailFrom
    ];

    const mailConfigured = mailVariables.every(Boolean);
    const mailPartiallyConfigured = mailVariables.some(Boolean);

    if (mailPartiallyConfigured && !mailConfigured) {
        errors.push(
            'La configuración de correo está incompleta. Revisá MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS y MAIL_FROM.'
        );
    }

    if (
        config.mailPort &&
        (!Number.isInteger(Number(config.mailPort)) ||
            Number(config.mailPort) < 1 ||
            Number(config.mailPort) > 65535)
    ) {
        errors.push('MAIL_PORT debe ser un número entre 1 y 65535.');
    }

    if (errors.length > 0) {
        throw new Error(
            `Error en la configuración:\n- ${errors.join('\n- ')}`
        );
    }
};

export default config;
