'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.addTree = async (event) => {
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

  const { image_path } = JSON.parse(event.body);
  if (!image_path) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'image_path is required',
      }),
    };
  }

  const query = 'INSERT INTO users (user_id, tree) VALUES (?, ?)';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [ decoded.userId, image_path], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error adding tree',
            error: error.message,
          }),
        });
      } else {
        resolve({
          statusCode: 201,
          body: JSON.stringify({
            message: 'tree added successfully',
            answerId: results.insertId,
          }),
        });
      }
    });
  });
};
