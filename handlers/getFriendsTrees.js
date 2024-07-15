'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getFriendsTrees = async (event) => {
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
        message: 'Invaild or expired token',
      }),
    };
  }

  const selectFriendsQuery = `
    SELECT following_id AS user_id
    FROM friends
    WHERE follower_id = ?
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
    connection.query(selectFriendsQuery,[decoded.userId], (error, friends) => {
      if (error) {
        console.error('Error selecting friends:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving friends',
            error: error.message,
          }),
        });
      } else {
        const friendIds = friends.map(friend => friend.user_id);
        
        connection.query(selectUserColorsQuery, [friendIds], (error, colorResults) => {
          if (error) {
            console.error('Error retrieving friend colors:', JSON.stringify(error, null, 2));
            reject({
              statusCode: 500,
              body: JSON.stringify({
                message: 'Error retrieving friend colors',
                error: error.message,
              }),
            });
          } else {
            connection.query(selectUserKeywordsQuery, [friendIds], (error, keywordResults) => {
              if (error) {
                console.error('Error retrieving friend keywords:', JSON.stringify(error, null, 2));
                reject({
                  statusCode: 500,
                  body: JSON.stringify({
                    message: 'Error retrieving friend keywords',
                    error: error.message,
                  }),
                });
              } else {
                const dataByUser = friendIds.map(userId => ({
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
