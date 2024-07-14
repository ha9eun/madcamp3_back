'use strict';

const { connectToDatabase } = require('../lib/db');


module.exports.getTodayQuestion = async (event) => {
  const today = new Date().toISOString().split('T')[0];
  const query = 'SELECT * FROM questions WHERE date = ?';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query,[today], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving today\'s questions',
            error: error.message,
          }),
        });
      } else if (results.length === 0) {
        resolve({
            statusCode: 404,
            body: JSON.stringify({
                message: 'No question found for today',
            })
        });
      } else {
        resolve({
          statusCode: 200,
          body: JSON.stringify(results[0]),
        });
      }
    });
  });
};
