'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getTodayAnswer = async (event) => {
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
        message: 'Invalid or expired token',
      }),
    };
  }

  const today = new Date();
  const utc = today.getTime() + today.getTimezoneOffset() * 60000;
  const localToday = new Date(utc + 9 * 3600000); // KST 기준
  const formattedToday = `${localToday.getFullYear()}-${(localToday.getMonth() + 1).toString().padStart(2, '0')}-${localToday.getDate().toString().padStart(2, '0')}`;

  const query = `
    SELECT a.*, q.question, k.keyword
    FROM answers a
    JOIN questions q ON a.date = q.date
    LEFT JOIN keywords k ON a.answer_id = k.answer_id
    WHERE a.user_id = ? AND DATE(a.date) = ?
  `;

  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [decoded.userId, formattedToday], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving today\'s answer',
            error: error.message,
          }),
        });
      } else if (results.length === 0) {
        resolve({
          statusCode: 404,
          body: JSON.stringify({
            message: 'No answer found for today',
          }),
        });
      } else {
        const answer = {
          answer_id: results[0].answer_id,
          date: results[0].date,
          user_id: results[0].user_id,
          answer: results[0].answer,
          color: results[0].color,
          visibility: results[0].visibility,
          question: results[0].question,
          keywords: results.filter(row => row.keyword).map(row => row.keyword),
        };

        resolve({
          statusCode: 200,
          body: JSON.stringify(answer),
        });
      }
    });
  });
};
