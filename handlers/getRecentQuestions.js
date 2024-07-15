'use strict';

const { connectToDatabase } = require('../lib/db');

module.exports.getRecentQuestions = async (event) => {
  const today = new Date();
  const yesterday = new Date(today);
  const dayBeforeYesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);
  dayBeforeYesterday.setDate(today.getDate() - 2);

  const dates = [
    today.toISOString().split('T')[0],
    yesterday.toISOString().split('T')[0],
    dayBeforeYesterday.toISOString().split('T')[0]
  ];

  const query = 'SELECT * FROM questions WHERE date IN (?, ?, ?)';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, dates, (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving recent questions',
            error: error.message,
          }),
        });
      } else if (results.length === 0) {
        resolve({
          statusCode: 404,
          body: JSON.stringify({
            message: 'No questions found for the past three days',
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
