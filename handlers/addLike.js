'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.addLike = async (event) => {
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

  const { answer_id } = event.pathParameters;

  if (!answer_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'answer_id is required',
      }),
    };
  }

  const query = 'INSERT INTO likes (user_id, answer_id) VALUES (?, ?)';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [ decoded.userId, answer_id], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error adding like',
            error: error.message,
          }),
        });
      } else {
        resolve({
          statusCode: 201,
          body: JSON.stringify({
            message: 'Like added successfully',
            answerId: results.insertId,
          }),
        });
      }
    });
  });
};
