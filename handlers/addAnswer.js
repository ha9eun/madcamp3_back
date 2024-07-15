'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.addAnswer = async (event) => {
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

  const { answer, color, visibility, keywords } = JSON.parse(event.body);
  console.log(keywords);
  if (!answer || !color || !visibility || !keywords || !Array.isArray(keywords) || keywords.length !== 3) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Answer, color, visibility, and exactly 3 keywords are required',
      }),
    };
  }

  const insertAnswerQuery = 'INSERT INTO answers (date, user_id, answer, color, visibility) VALUES (?, ?, ?, ?, ?)';
  const insertKeywordQuery = 'INSERT INTO keywords (answer_id, keyword) VALUES ?';
  const today = new Date().toISOString().split('T')[0];
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.beginTransaction(err => {
      if (err) {
        console.error('Error starting transaction:', JSON.stringify(err, null, 2));
        return reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error starting transaction',
            error: err.message,
          }),
        });
      }

      connection.query(insertAnswerQuery, [today, decoded.userId, answer, color, visibility], (error, results) => {
        if (error) {
          console.error('Error inserting answer:', JSON.stringify(error, null, 2));
          return connection.rollback(() => {
            reject({
              statusCode: 500,
              body: JSON.stringify({
                message: 'Error adding answer',
                error: error.message,
              }),
            });
          });
        }

        const answerId = results.insertId;
        const keywordValues = keywords.map(keyword => [answerId, keyword]);

        connection.query(insertKeywordQuery, [keywordValues], (error) => {
          if (error) {
            console.error('Error inserting keywords:', JSON.stringify(error, null, 2));
            return connection.rollback(() => {
              reject({
                statusCode: 500,
                body: JSON.stringify({
                  message: 'Error adding keywords',
                  error: error.message,
                }),
              });
            });
          }

          connection.commit(err => {
            if (err) {
              console.error('Error committing transaction:', JSON.stringify(err, null, 2));
              return connection.rollback(() => {
                reject({
                  statusCode: 500,
                  body: JSON.stringify({
                    message: 'Error committing transaction',
                    error: err.message,
                  }),
                });
              });
            }

            resolve({
              statusCode: 201,
              body: JSON.stringify({
                message: 'Answer and keywords added successfully',
                answerId,
              }),
            });
          });
        });
      });
    });
  });
};
