'use strict';

function replyError(reply, errorObject = {}) {
    errorObject.status = false;
    errorObject.type = 'error';
    errorObject.statusCode = errorObject?.statusCode || 400;
    errorObject.message = errorObject.message || 'Something went wrong. Please try again';
    
    return reply.code(errorObject.statusCode).send(errorObject);
}

function replySuccess(reply, result = {}, addOnProperties = {}) {
    const response = {
        status: true,
        success: true,
        count: 1,
        data: result || {},
        type: 'object',
        ...addOnProperties
    };
    
    if (result && Array.isArray(result)) {
        response.count = result.length;
        response.type = 'array';
    }
    
    return reply.code(200).send(response);
}

module.exports = { replyError, replySuccess };
