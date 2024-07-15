'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getAnswerDetails = async (event) => {
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

  const { answer_id } = event.pathParameters;

  const query = `
    SELECT a.*, q.question, k.keyword
    FROM answers a
    JOIN questions q ON a.date = q.date
    LEFT JOIN keywords k ON a.answer_id = k.answer_id
    WHERE a.answer_id = ?
  `;

  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [answer_id], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving answer details',
            error: error.message,
          }),
        });
      } else if (results.length === 0) {
        resolve({
          statusCode: 404,
          body: JSON.stringify({
            message: 'Answer not found',
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
