'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.deleteFriend = async (event) => {
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

  const { following_id } = JSON.parse(event.body);

  if (!following_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'following_id is required',
      }),
    };
  }

  const query = 'DELETE FROM friends WHERE follower_id = ? AND following_id = ?';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [ decoded.userId, following_id], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error deleting friend',
            error: error.message,
          }),
        });
      } else {
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: 'Friend deleted successfully',
            answerId: results.insertId,
          }),
        });
      }
    });
  });
};
