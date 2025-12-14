'use strict';

const bcrypt = require('bcrypt'); 

async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password: ' + error.message);
    }
}

async function verifyPassword(enteredPassword, storedHash) {
    try {
        const match = await bcrypt.compare(enteredPassword, storedHash);
        return match;
    } catch (error) {
        throw new Error('Error verifying password: ' + error.message);
    }
}

module.exports = { hashPassword, verifyPassword };
