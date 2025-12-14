'use strict';

async function createUser(knex, userDetails) {
    try {
        const [response] = await knex('users')
            .insert(userDetails)
            .returning(['username', 'email', 'mobile', 'first_name', 'middle_name', 'last_name', 'id']);
        
        return response;
    } catch (error) {
        throw new Error("User creation failed: " + error.message);   
    }
}

async function getUserDetails(knex, username) {
    try {
        const user = await knex('users')
            .select('username', 'email', 'mobile', 'first_name', 'middle_name', 'password', 'last_name', 'id')
            .where({ username })
            .first();
        
        return user || {};
    } catch (err) {
        throw new Error("Failed to fetch user details: " + err.message);
    }
}

async function getUserImage(knex, username) {
    try {
        const user = await knex('users')
            .select('profile_photo')
            .where({ username })
            .first();
        
        return user || {};
    } catch (err) {
        throw new Error("Failed to fetch user image: " + err.message);
    }
}

module.exports = { createUser, getUserDetails, getUserImage };
