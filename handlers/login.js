'use strict';

const { connectToDatabase } = require('../lib/db');
const jwt = require('jsonwebtoken');

module.exports.login = async (event) => {
  const { userId, password } = JSON.parse(event.body);

  if (!userId || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'UserId, password are required',
      }),
    };
  }

  const query = 'SELECT * FROM users WHERE user_id = ?';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [userId], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error logging in user',
            error: error.message,
          }),
        });
      } else if (results.length === 0) {
        resolve({
          statusCode: 401,
          body: JSON.stringify({
            message: "Invalid id or password",
          }),
        });

      } else {
        const user = results[0];

        if (password === user.password) {
          const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
          });

          resolve({
            statusCode: 200,
            body: JSON.stringify({
              message: 'Login successful',
              token,
            }),
        });
        } else {
          resolve({
            statusCode: 401,
            body: JSON.stringify({
              message: "Invalid id or password",
            }),
          });
        }
      }
    });
  });
};   
          