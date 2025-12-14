'use strict';

const crypto = require("crypto");

function decryptData(encryptedString, config) {
    try {
        const aesSecKey = Buffer.from(config.ENCRYPTION_KEY_HEX, "hex");
        const [ivBase64, encryptedBase64] = encryptedString.split(":");
        
        if (!ivBase64 || !encryptedBase64) {
            throw new Error("Invalid encrypted data format");
        }
        
        const iv = Buffer.from(ivBase64, "base64"); 
        const encryptedBuffer = Buffer.from(encryptedBase64, "base64");
        
        if (iv.length !== 12) {
            throw new Error("Invalid IV length");
        }
        
        const decipher = crypto.createDecipheriv("aes-256-gcm", aesSecKey, iv);
        const authTag = encryptedBuffer.slice(-16); 
        const ciphertext = encryptedBuffer.slice(0, -16);
        
        decipher.setAuthTag(authTag); 
        let decrypted = decipher.update(ciphertext);
        decrypted += decipher.final("utf8"); 
        
        return decrypted;
    } catch (error) {
        throw new Error("Decryption error: " + error.message);
    }
}

function decryptObject(obj, dec_keys, config) {
    try {
        for (let key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            
            if (dec_keys.includes(key) && typeof obj[key] === "string") {
                obj[key] = decryptData(obj[key], config);
            } else if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                obj[key] = decryptObject(obj[key], dec_keys, config);
            } else if (Array.isArray(obj[key])) {
                obj[key] = obj[key].map(item => {
                    if (item && typeof item === "object") {
                        return decryptObject(item, dec_keys, config);
                    }
                    return item;
                });
            }
        }
        return obj;
    } catch (error) {
        throw error;
    }
}

module.exports = { decryptObject, decryptData };
