'use strict';

const jwt = require('jsonwebtoken');
const { getCacheValue, setCacheValue } = require('./redisClient');

async function generateToken(app, userdata, device_info, config) {
    try {
        userdata.fingerprint = device_info.fingerprint;
        const token = jwt.sign(
            userdata,
            config.JWT_SECRET,
            { expiresIn: config.TOKEN_EXPIRY }
        );
        
        await setCacheValue(
            userdata.username + "_token", 
            token, 
            config.TOKEN_EXPIRY
        );
        
        const cachedData = await getCacheValue(userdata.username + config.DEVICES_KEY);
        if (cachedData) {
            const devices = JSON.parse(cachedData);
            const exist = devices.find(e => e.fingerprint === device_info.fingerprint);
            if (exist) {
                return token;
            }
            devices.push(device_info);
            await setCacheValue(
                userdata.username + config.DEVICES_KEY, 
                JSON.stringify(devices)
            );
        } else {
            await setCacheValue(
                userdata.username + config.DEVICES_KEY, 
                JSON.stringify([device_info])
            );
        }
        
        return token;
    } catch (error) {
        throw new Error('Error generating token: ' + error.message);
    }
}

async function decodeToken(token, config) {
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

async function validateAccessToken(request, reply, app, config) {
    try {
        const { url } = request.raw;
        const publicAPIs = ["login", "logout", "signup", "public", "internal", "socket.io"];
        const isPublicAPI = publicAPIs.some(api => url.includes(api));
        
        if (isPublicAPI) {
            return; // No token validation needed
        }
        
        if (!request.headers || !request.headers['authorization']) {
            return reply.code(401).send({ 
                code: 401, 
                type: 'error', 
                message: "Authorization required" 
            });
        }
        
        if (!request.headers['authorization'].includes("Bearer")) {
            return reply.code(401).send({ 
                code: 401, 
                type: 'error', 
                message: "Authorization required" 
            });
        }
        
        const token = request.headers['authorization'].split(" ")[1];
        if (!token || token === '') {
            return reply.code(401).send({ 
                code: 401, 
                type: 'error', 
                message: "Authorization required" 
            });
        }
        
        const decoded = jwt.verify(token, config.JWT_SECRET);
        request.token = token;
        request.user_info = decoded;
        
        if (!decoded || Object.keys(decoded).length === 0) {
            return reply.code(401).send({ 
                code: 401, 
                type: 'error', 
                message: "Authorization required" 
            });
        }
        
        const cachedData = await getCacheValue(decoded.username + config.DEVICES_KEY);
        if (!cachedData) {
            return reply.code(401).send({ 
                code: 401, 
                type: 'error', 
                message: "Authorization required" 
            });
        }
        
        const devices = JSON.parse(cachedData);
        const exist = devices.find(e => e.fingerprint === decoded.fingerprint);
        if (!exist) {
            return reply.code(401).send({ 
                code: 401, 
                type: 'error', 
                message: "Authorization required" 
            });
        }
    } catch (error) {
        return reply.code(401).send({ 
            code: 401, 
            type: 'error', 
            message: "Authorization required" 
        });
    }
}

module.exports = { generateToken, decodeToken, validateAccessToken };
