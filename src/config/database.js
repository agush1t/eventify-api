import mongoose from 'mongoose';
import config from './config.js';

const connectDB = async () => {
    if (!config.mongoUrl) {
        throw new Error(
            'Falta configurar MONGO_URL para conectar con MongoDB.'
        );
    }

    try {
        await mongoose.connect(config.mongoUrl);
        console.log('MongoDB conectado correctamente');
    } catch (error) {
        throw new Error(
            `No se pudo conectar con MongoDB: ${error.message}`,
            { cause: error }
        );
    }
};

export default connectDB;
