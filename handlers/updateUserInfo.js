'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.updateUserInfo = async (event) => {
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

  const { nickname, password } = JSON.parse(event.body);
  
  if (!nickname || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'nickname, password are required',
      }),
    };
  }

  const query = 'UPDATE users SET nickname = ?, password = ? WHERE user_id = ?';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [nickname, password, decoded.userId], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error updating answer',
            error: error.message,
          }),
        });
      } else if (results.affectedRows === 0) {
        resolve({
          statusCode: 404,
          body: JSON.stringify({
            message: 'User not found or not authorized',
          }),
        });
      } else {
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: 'User information updated successfully',
          }),
        });
      }
    });
  });
};
