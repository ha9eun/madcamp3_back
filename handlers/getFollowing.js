'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getFollowing = async (event) => {
  const token = event.headers.authorization || event.headers.Authorization;

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Authorization token is required',
      }),
    };
  }

  let decoded;
  try {
    decoded = verifyToken(token.split(' ')[1]);
  } catch (error) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Invaild or expired token',
      }),
    };
  }

  const query = `
    SELECT following_id
    FROM friends
    WHERE follower_id = ?
  `;
  
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [decoded.userId], (error, results) => {
      if (error) {
        console.error('Error retrieving following list:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving following list',
            error: error.message,
          }),
        });
      } else {
        resolve({
          statusCode: 200,
          body: JSON.stringify(results),
        });
      }
    });
  });
};
