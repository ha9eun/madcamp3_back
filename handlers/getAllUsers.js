'use strict';

const { connectToDatabase } = require('../lib/db');


module.exports.getAllUsers = async (event) => {
  const query = 'SELECT user_id, nickname FROM users';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving questions',
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
