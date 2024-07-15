'use strict';

const { connectToDatabase } = require('../lib/db');

module.exports.getRandomUserTrees = async (event) => {
  const selectRandomUsersQuery = `
    SELECT DISTINCT user_id
    FROM answers
    ORDER BY RAND()
    LIMIT 3
  `;
  
  const selectUserColorsQuery = `
    SELECT user_id, color
    FROM answers
    WHERE user_id IN (?)
  `;

  const selectUserKeywordsQuery = `
    SELECT a.user_id, k.keyword
    FROM answers a
    JOIN keywords k ON a.answer_id = k.answer_id
    WHERE a.user_id IN (?)
  `;
  
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(selectRandomUsersQuery, (error, randomUsers) => {
      if (error) {
        console.error('Error selecting random users:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving random users',
            error: error.message,
          }),
        });
      } else {
        const userIds = randomUsers.map(user => user.user_id);
        
        connection.query(selectUserColorsQuery, [userIds], (error, colorResults) => {
          if (error) {
            console.error('Error retrieving user colors:', JSON.stringify(error, null, 2));
            reject({
              statusCode: 500,
              body: JSON.stringify({
                message: 'Error retrieving user colors',
                error: error.message,
              }),
            });
          } else {
            connection.query(selectUserKeywordsQuery, [userIds], (error, keywordResults) => {
              if (error) {
                console.error('Error retrieving user keywords:', JSON.stringify(error, null, 2));
                reject({
                  statusCode: 500,
                  body: JSON.stringify({
                    message: 'Error retrieving user keywords',
                    error: error.message,
                  }),
                });
              } else {
                const dataByUser = userIds.map(userId => ({
                  user_id: userId,
                  colors: colorResults
                    .filter(row => row.user_id === userId)
                    .map(row => row.color),
                  keywords: keywordResults
                    .filter(row => row.user_id === userId)
                    .map(row => row.keyword)
                }));
                
                resolve({
                  statusCode: 200,
                  body: JSON.stringify(dataByUser),
                });
              }
            });
          }
        });
      }
    });
  });
};
