'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getUserKeywords = async (event) => {
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
        message: 'Invalied or expired token',
      }),
    };
  }

  const query = `
    SELECT a.answer_id, k.keyword
    FROM answers a
    LEFT JOIN keywords k ON a.answer_id = k.answer_id
    WHERE a.user_id = ?
  `;
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [decoded.userId], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving user keywords',
            error: error.message,
          }),
        });
      } else {
        const groupedResults = results.reduce((acc, row) => {
            if (!acc[row.answer_id]) {
              acc[row.answer_id] = [];
            }
            acc[row.answer_id].push(row.keyword);
            return acc;
          }, {});
  
          const formattedResults = Object.keys(groupedResults).map(answer_id => ({
            answer_id,
            keywords: groupedResults[answer_id]
          }));
  
          resolve({
            statusCode: 200,
            body: JSON.stringify(formattedResults),
          });
        }
      });
    });
};
