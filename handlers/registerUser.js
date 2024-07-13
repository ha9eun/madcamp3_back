'use strict';

const { connectToDatabase } = require('../lib/db');

module.exports.registerUser = async (event) => {
  const { userId, nickname, password } = JSON.parse(event.body);

  if (!userId || !nickname || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'UserId, password and nickname are required',
      }),
    };
  }

  const query = 'INSERT INTO users (user_id, nickname, password) VALUES (?, ?, ?)';
  const values = [userId, nickname, password];
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error registering user',
            error: error.message,
          }),
        });
      } else {
        resolve({
          statusCode: 201,
          body: JSON.stringify({
            message: 'User registered successfully',
            userId: results.insertId,
          }),
        });
      }
    });
  });
};
