'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.addAnswer = async (event) => {
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

  const { answer, color, visibility } = JSON.parse(event.body);

  if (!answer || !color || !visibility) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'color and visibility and answer are required',
      }),
    };
  }

  const query = 'INSERT INTO answers (date, user_id, answer, color, visibility) VALUES (?, ?, ?, ?, ?)';
  const today = new Date().toISOString().split('T')[0];
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [ today, decoded.userId, answer, color, visibility], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error adding answer',
            error: error.message,
          }),
        });
      } else {
        resolve({
          statusCode: 201,
          body: JSON.stringify({
            message: 'Answer added successfully',
            answerId: results.insertId,
          }),
        });
      }
    });
  });
};
