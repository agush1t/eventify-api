import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: process.env.PORT || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUrl: process.env.MONGO_URL,
    jwtSecret: process.env.JWT_SECRET
};

export default config;
