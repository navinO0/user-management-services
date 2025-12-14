'use strict';

let redisClient;

async function initializeRedis(redis) {
    redisClient = redis;
}

async function setCacheValue(key, value, expiry = 3600) {
    try {
        if (!redisClient) {
            throw new Error('Redis client not initialized');
        }
        if (expiry) {
            await redisClient.setex(key, expiry, value);
        } else {
            await redisClient.set(key, value);
        }
    } catch (error) {
        throw new Error('Error setting cache value: ' + error.message);
    }
}

async function getCacheValue(key) {
    try {
        if (!redisClient) {
            throw new Error('Redis client not initialized');
        }
        return await redisClient.get(key);
    } catch (error) {
        throw new Error('Error getting cache value: ' + error.message);
    }
}

async function deleteCacheValue(key) {
    try {
        if (!redisClient) {
            throw new Error('Redis client not initialized');
        }
        await redisClient.del(key);
    } catch (error) {
        throw new Error('Error deleting cache value: ' + error.message);
    }
}

module.exports = { 
    initializeRedis, 
    setCacheValue, 
    getCacheValue, 
    deleteCacheValue 
};
