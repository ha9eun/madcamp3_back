'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getAnswerDetails = async (event) => {
  const token = event.headers.authorization || event.headers.Authorization;

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Unauthorized',
      }),
    };
  }

  let decoded;
  try {
    decoded = verifyToken(token.split(' ')[1]);
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Unauthorized',
      }),
    };
  }
  const { answer_id } = event.pathParameters;
  
  const query = `
    SELECT *
    FROM answers
    WHERE answer_id = ?
  `;
  
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [answer_id], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving user keywords and colors',
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
