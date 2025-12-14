'use strict';

const { generateUniqueCode } = require('../utils/codeGenerator');
const { decryptObject } = require('../utils/encryption');
const { hashPassword, verifyPassword } = require('../utils/passwordHash');
const { setCacheValue, deleteCacheValue, getCacheValue } = require('../utils/redisClient');
const { generateToken, decodeToken } = require('../utils/tokenGenerator');
const { createUser, getUserDetails, getUserImage } = require('../services/userService');
const { replyError, replySuccess } = require('../utils/responseHelpers');

async function CREATE_USER(request, reply) {
    try {
        const body = request.body;
        const device_info = request.body.device_info;
        const { username, password, email, mobile, first_name, last_name, middle_name, profile_photo } = decryptObject(
            body,
            ['username', 'email', 'mobile', 'first_name', 'middle_name', "password", 'last_name'],
            this.config
        );
        
        const user = await getUserDetails(this.knex, username);
        if (user && user.username) {
            throw new Error("Username not available");
        }
        
        // Validation patterns
        const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobilePattern = /^\d{10}$/;
        const namePattern = /^[a-zA-Z]{2,30}$/;
        
        if (!usernamePattern.test(username)) {
            throw new Error("Invalid username. Must be 3-20 characters long and contain only letters, numbers, or underscores.");
        }
        if (!emailPattern.test(email)) {
            throw new Error("Invalid email format.");
        }
        if (!mobilePattern.test(mobile)) {
            throw new Error("Invalid mobile number. Must be exactly 10 digits.");
        }
        if (!namePattern.test(first_name)) {
            throw new Error("First name must be between 2-30 alphabetic characters.");
        }
        if (middle_name && !namePattern.test(middle_name)) {
            throw new Error("Middle name must be between 2-30 alphabetic characters (if provided).");
        }
        if (last_name && !namePattern.test(last_name)) {
            throw new Error("Last name must be between 2-30 alphabetic characters (if provided).");
        }
        
        const hashedPassword = await hashPassword(password);
        
        const userDetails = {
            username,
            email,
            password: hashedPassword,
            mobile,
            first_name,
            last_name,
            middle_name,
            profile_photo
        };
        
        const userCreateResponse = await createUser(this.knex, userDetails);
        const token = await generateToken(this, userCreateResponse, device_info, this.config);
        return replySuccess(reply, { token });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}

async function LOGIN(request, reply) {
    try {
        const body = request.body;
        const { device_info } = request.body;
        const { username, password } = decryptObject(
            body,
            ['username', 'password'],
            this.config
        );
        
        const user = await getUserDetails(this.knex, username);
        if (!user || !user.username) {
            return replyError(reply, { message: 'Username or password is incorrect' });
        }
        
        const isMatch = await verifyPassword(password, user.password);
        if (!isMatch) {
            return replyError(reply, { message: 'Username or password is incorrect' });
        }
        
        delete user.password;
        const token = await generateToken(this, user, device_info, this.config);
        return replySuccess(reply, { token });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}

async function GET_CODE(request, reply) {
    try {
        const token = request.token;
        const code = generateUniqueCode();
        await setCacheValue(code, token, this.config.QR_CODE_EXPIRY);
        return replySuccess(reply, { code });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}

async function LOGIN_WITH_CODE(request, reply) {
    try {
        const loginCode = request.params.code;
        const { device_info } = request.body;
        const cachedData_code = await getCacheValue(loginCode);
        
        if (!cachedData_code) {
            return replyError(reply, { message: 'Invalid code or code has expired' });
        }
        
        const userdata = await decodeToken(cachedData_code, this.config);
        delete userdata.exp;
        
        const cachedData = await getCacheValue(userdata.username + this.config.DEVICES_KEY);
        if (cachedData) {
            const devices = JSON.parse(cachedData);
            if (devices.length > 2) {
                return replyError(reply, { message: 'Device limit exceeded' });
            }
            const exist = devices.find(e => e.fingerprint === device_info.fingerprint);
            if (exist) {
                const token = await generateToken(this, userdata, device_info, this.config);
                return replySuccess(reply, { message: 'Login success', token });
            }
            devices.push(device_info);
            await setCacheValue(userdata.username + this.config.DEVICES_KEY, JSON.stringify(devices));
        }
        
        const token = await generateToken(this, userdata, device_info, this.config);
        return replySuccess(reply, { message: 'Login success', token });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}

async function GET_IMAGE(request, reply) {
    try {
        const username = request.user_info.username;
        const img_data = await getUserImage(this.knex, username);
        return replySuccess(reply, { message: 'success', image: img_data.profile_photo });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}

async function REGISTER_GOOGLE_AUTH(request, reply) {
    try {
        const body = request.body;
        const { device_info } = request.body;
        const { username, email, first_name, profile_photo } = decryptObject(
            body,
            ['username', 'email', 'first_name'],
            this.config
        );
        
        let user = await getUserDetails(this.knex, username);
        let token;
        
        if (user && user.username) {
            token = await generateToken(this, { username, email, first_name, id: user.id }, device_info, this.config);
            return replySuccess(reply, { message: "User already registered", token });
        }
        
        const userDetails = {
            username,
            email,
            first_name,
            profile_photo,
            password: ''
        };
        
        user = await createUser(this.knex, userDetails);
        token = await generateToken(this, { username, email, first_name, id: user.id }, device_info, this.config);
        return replySuccess(reply, { message: 'success', token });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}

async function GET_DEVICES(request, reply) {
    try {
        const token = request.token;
        const userdata = await decodeToken(token, this.config);
        const cachedData = await getCacheValue(userdata.username + this.config.DEVICES_KEY);
        const devices = JSON.parse(cachedData) || [];
        return replySuccess(reply, { devices });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}

async function REMOVE_DEVICE(request, reply) {
    try {
        const token = request.token;
        const is_remove_all_devices = request.body.is_remove_all_devices;
        const userdata = await decodeToken(token, this.config);
        const cachedData = await getCacheValue(userdata.username + this.config.DEVICES_KEY);
        const devices = JSON.parse(cachedData);
        
        if (!is_remove_all_devices && !devices.find(e => e.fingerprint === request.body.device_fingerprint)) {
            return replyError(reply, { message: 'Device not found' });
        }
        
        if (is_remove_all_devices) {
            await setCacheValue(userdata.username + this.config.DEVICES_KEY, JSON.stringify([]));
        } else {
            await setCacheValue(
                userdata.username + this.config.DEVICES_KEY, 
                JSON.stringify(devices.filter(e => e.fingerprint !== request.body.device_fingerprint))
            );
        }
        
        return replySuccess(reply, { message: 'Device removed successfully' });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}

module.exports = {
    CREATE_USER,
    LOGIN,
    GET_CODE,
    LOGIN_WITH_CODE,
    GET_IMAGE,
    REGISTER_GOOGLE_AUTH,
    GET_DEVICES,
    REMOVE_DEVICE
};
