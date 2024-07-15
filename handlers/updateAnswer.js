'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.updateAnswer = async (event) => {
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

  const { color, answer, visibility } = JSON.parse(event.body);
  const { answerId } = event.pathParameters;
  if (!answerId || !color|| !answer || !visibility) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Answer ID, color, answer, and visibility are all required',
      }),
    };
  }

  const query = 'UPDATE answers SET color = ?, answer = ?, visibility = ? WHERE answer_id = ?';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [color, answer, visibility, answerId], (error, results) => {
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
            message: 'Answer not found or not authorized',
          }),
        });
      } else {
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: 'Answer updated successfully',
          }),
        });
      }
    });
  });
};
