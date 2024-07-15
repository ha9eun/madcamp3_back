'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.deleteAnswer = async (event) => {
    const token = event.headers.Authorization || event.headers.authorization;

    if (!token) {
        return {
        statusCode: 401,
        body: JSON.stringify({
            message: 'Authorization token is required',
        }),
        };
    }

    const decoded = verifyToken(token.split(' ')[1]);

    if (!decoded) {
        return {
        statusCode: 403,
        body: JSON.stringify({
            message: 'Invalid or expired token',
        }),
        };
    }

    const { answerId } = event.pathParameters;

    if (!answerId) {
        return {
        statusCode: 400,
        body: JSON.stringify({
            message: 'Answer ID is required',
        }),
        };
    }

    const query = 'DELETE FROM answers WHERE answer_id = ?';
    const connection = connectToDatabase();

    return new Promise((resolve, reject) => {
        connection.query(query, [answerId], (error, results) => {
        if (error) {
            console.error('Error executing query:', JSON.stringify(error, null, 2));
            reject({
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error deleting answer',
                error: error.message,
            }),
            });
        } else if (results.affectedRows === 0) {
            resolve({
            statusCode: 404,
            body: JSON.stringify({
                message: 'Answer not found or not authorized',
            }),
            });
        } else {
            resolve({
            statusCode: 200,
            body: JSON.stringify({
                message: 'Answer deleted successfully',
            }),
            });
        }
        });
    });
};
