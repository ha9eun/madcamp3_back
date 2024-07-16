'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.updateAnswer = async (event) => {
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

  const { color, answer, visibility, keywords } = JSON.parse(event.body);
  const { answerId } = event.pathParameters;
  
  if (!answerId || !color || !answer || !visibility || !keywords || !Array.isArray(keywords) || keywords.length !== 3) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Answer ID, color, answer, visibility, and exactly 3 keywords are all required',
      }),
    };
  }

  const updateAnswerQuery = 'UPDATE answers SET color = ?, answer = ?, visibility = ? WHERE answer_id = ?';
  const deleteKeywordsQuery = 'DELETE FROM keywords WHERE answer_id = ?';
  const insertKeywordsQuery = 'INSERT INTO keywords (answer_id, keyword) VALUES ?';

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

      connection.query(updateAnswerQuery, [color, answer, visibility, answerId], (error, results) => {
        if (error) {
          console.error('Error updating answer:', JSON.stringify(error, null, 2));
          return connection.rollback(() => {
            reject({
              statusCode: 500,
              body: JSON.stringify({
                message: 'Error updating answer',
                error: error.message,
              }),
            });
          });
        } else if (results.affectedRows === 0) {
          return connection.rollback(() => {
            resolve({
              statusCode: 404,
              body: JSON.stringify({
                message: 'Answer not found or not authorized',
              }),
            });
          });
        }

        connection.query(deleteKeywordsQuery, [answerId], (error) => {
          if (error) {
            console.error('Error deleting old keywords:', JSON.stringify(error, null, 2));
            return connection.rollback(() => {
              reject({
                statusCode: 500,
                body: JSON.stringify({
                  message: 'Error deleting old keywords',
                  error: error.message,
                }),
              });
            });
          }

          const keywordValues = keywords.map(keyword => [answerId, keyword]);
          connection.query(insertKeywordsQuery, [keywordValues], (error) => {
            if (error) {
              console.error('Error inserting new keywords:', JSON.stringify(error, null, 2));
              return connection.rollback(() => {
                reject({
                  statusCode: 500,
                  body: JSON.stringify({
                    message: 'Error inserting new keywords',
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
                statusCode: 200,
                body: JSON.stringify({
                  message: 'Answer and keywords updated successfully',
                }),
              });
            });
          });
        });
      });
    });
  });
};
