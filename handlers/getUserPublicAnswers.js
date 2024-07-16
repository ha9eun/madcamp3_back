'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getUserPublicAnswers = async (event) => {
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

  const { user_id } = event.pathParameters;
  const currentUserId = decoded.userId;

  const query = `
    SELECT a.answer_id, a.date, q.question, a.answer, a.color, k.keyword, u.nickname
    FROM answers a
    JOIN questions q ON a.date = q.date
    LEFT JOIN keywords k ON a.answer_id = k.answer_id
    JOIN users u ON a.user_id = u.user_id
    WHERE a.user_id = ? AND a.visibility = 'public'
  `;

  const followQuery = `
    SELECT * FROM friends
    WHERE follower_id = ? AND following_id = ?
  `;

  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(followQuery, [currentUserId, user_id], (followError, followResults) => {
      if (followError) {
        console.error('Error checking follow status:', JSON.stringify(followError, null, 2));
        return reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error checking follow status',
            error: followError.message,
          }),
        });
      }

      const isFollowing = followResults.length > 0;

      connection.query(query, [user_id], (error, results) => {
        if (error) {
          console.error('Error retrieving answers:', JSON.stringify(error, null, 2));
          return reject({
            statusCode: 500,
            body: JSON.stringify({
              message: 'Error retrieving answers',
              error: error.message,
            }),
          });
        } else {
          const answers = results.reduce((acc, row) => {
            const answer = acc.find(a => a.answer_id === row.answer_id);
            if (answer) {
              answer.keywords.push(row.keyword);
            } else {
              acc.push({
                answer_id: row.answer_id,
                date: row.date,
                question: row.question,
                answer: row.answer,
                color: row.color,
                nickname: row.nickname,
                keywords: row.keyword ? [row.keyword] : [],
              });
            }
            return acc;
          }, []);

          resolve({
            statusCode: 200,
            body: JSON.stringify({ isFollowing, answers }),
          });
        }
      });
    });
  });
};
