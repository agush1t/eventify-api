import app from './app.js';
import config from './config/config.js';
import connectDB from './config/database.js';

const PORT = config.port;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
};

startServer();
