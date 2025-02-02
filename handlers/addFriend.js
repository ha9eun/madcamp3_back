'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.addFriend = async (event) => {
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

  const { friendId } = event.pathParameters;

  if (!friendId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'following_id is required',
      }),
    };
  }

  const query = 'INSERT INTO friends (follower_id, following_id) VALUES (?, ?)';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [ decoded.userId, friendId], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error adding friend',
            error: error.message,
          }),
        });
      } else {
        resolve({
          statusCode: 201,
          body: JSON.stringify({
            message: 'Friend added successfully',
            answerId: results.insertId,
          }),
        });
      }
    });
  });
};
