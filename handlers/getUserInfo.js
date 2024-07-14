'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getUserInfo = async (event) => {
  const token = event.headers.Authorization || event.headers.authorization;

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Authorization token is required',
      }),
    };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Invalid or expired token',
      }),
    };
  }

  const query = 'SELECT user_id, nickname FROM users WHERE user_id = ?';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [decoded.userId], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving questions',
            error: error.message,
          }),
        });
      } else if(results.length === 0) {
        resolve({
            statusCode: 404,
            body: JSON.stringify({
              message: 'User not found',
            }),
          });
      }
        else {
        resolve({
          statusCode: 200,
          body: JSON.stringify(results[0]),
        });
      }
    });
  });
};
