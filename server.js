'use strict';

const fastify = require('fastify');
const cors = require('@fastify/cors');
const sensible = require('@fastify/sensible');
const formbody = require('@fastify/formbody');
const knex = require('knex');
const redis = require('redis');
const config = require('../core/config');
const authRoutes = require('./routes/authRoutes');
const { initializeRedis } = require('./utils/redisClient');

async function startServer() {
    const app = fastify({
        logger: true,
    });
    
    // Register plugins
    await app.register(cors, {
        origin: true,
        credentials: true,
    });
    await app.register(sensible);
    await app.register(formbody);
    
    // Initialize database
    const knexInstance = knex({
        client: 'pg',
        connection: {
            host: config.DB_HOST,
            port: config.DB_PORT,
            user: config.DB_USER,
            password: config.DB_PASSWORD,
            database: config.DB_NAME,
            ssl: config.DB_SSL ? { rejectUnauthorized: false } : false
        }
    });
    
    // Initialize Redis
    const redisClient = redis.createClient({
        url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`
    });
    
    await redisClient.connect();
    await initializeRedis(redisClient);
    
    // Decorate app with dependencies
    app.decorate('knex', knexInstance);
    app.decorate('redis', redisClient);
    app.decorate('config', config);
    
    // Register routes
    await app.register(authRoutes, { prefix: '/user' });
    
    // Health check
    app.get('/health', async (request, reply) => {
        return { status: 'ok' };
    });
    
    // Start server
    try {
        await app.listen({ port: config.PORT, host: '0.0.0.0' });
        app.log.info(`Server running on port ${config.PORT}`);

        const closeGracefully = async (signal) => {
            app.log.info(`Received signal to terminate: ${signal}`);
            await app.close();
            process.exit(0);
        };
        process.on('SIGINT', () => closeGracefully('SIGINT'));
        process.on('SIGTERM', () => closeGracefully('SIGTERM'));
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

startServer();
