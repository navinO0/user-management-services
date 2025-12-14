'use strict';

const {
    CREATE_USER,
    LOGIN,
    GET_CODE,
    LOGIN_WITH_CODE,
    GET_IMAGE,
    REGISTER_GOOGLE_AUTH,
    GET_DEVICES,
    REMOVE_DEVICE
} = require('../controllers/authController');

module.exports = async (app) => {
    app.route({
        method: 'POST',
        url: '/public/create',
        handler: CREATE_USER,
    });

    app.route({
        method: 'POST',
        url: '/public/login',
        handler: LOGIN,
    });

    app.route({
        method: 'POST',
        url: '/get/code',
        handler: GET_CODE,
    });

    app.route({
        method: 'POST',
        url: '/login/code/:code',
        handler: LOGIN_WITH_CODE,
    });

    app.route({
        method: 'GET',
        url: '/get/image',
        handler: GET_IMAGE,
    });
    
    app.route({
        method: 'POST',
        url: '/public/register',
        handler: REGISTER_GOOGLE_AUTH,
    });

    app.route({
        method: 'GET',
        url: '/get/devices',
        handler: GET_DEVICES,
    });

    app.route({
        method: 'POST',
        url: '/delete/devices',
        handler: REMOVE_DEVICE,
    });
};
