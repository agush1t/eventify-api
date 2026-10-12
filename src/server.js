import app from './app.js';
import config, { validateConfig } from './config/config.js';
import connectDB from './config/database.js';

const startServer = async () => {
    try {
        validateConfig();

        await connectDB();

        app.listen(config.port, () => {
            console.log(
                `Servidor escuchando en el puerto ${config.port}`
            );
        });
    } catch (error) {
        console.error('No se pudo iniciar Eventify:', error.message);
        process.exitCode = 1;
    }
};

startServer();
