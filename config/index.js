'use strict';

require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    ENCRYPTION_KEY_HEX: process.env.ENCRYPTION_KEY_HEX || '',
    TOKEN_EXPIRY: parseInt(process.env.TOKEN_EXPIRY) || 86400, // 24 hours in seconds
    QR_CODE_EXPIRY: parseInt(process.env.QR_CODE_EXPIRY) || 300, // 5 minutes
    DEVICES_KEY: process.env.DEVICES_KEY || '_devices',
    
    // Database config
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT) || 5432,
    DB_NAME: process.env.DB_NAME || 'your_database',
    DB_USER: process.env.DB_USER || 'your_user',
    DB_PASSWORD: process.env.DB_PASSWORD || 'your_password',
    
    // Redis config
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
};
