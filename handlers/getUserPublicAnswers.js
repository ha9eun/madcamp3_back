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

  const nicknameQuery = `
    SELECT nickname FROM users WHERE user_id = ?
  `;

  const followQuery = `
    SELECT * FROM friends
    WHERE follower_id = ? AND following_id = ?
  `;

  const answersQuery = `
    SELECT a.answer_id, a.date, q.question, a.answer, a.color, k.keyword
    FROM answers a
    JOIN questions q ON a.date = q.date
    LEFT JOIN keywords k ON a.answer_id = k.answer_id
    WHERE a.user_id = ? AND a.visibility = 'public'
  `;

  const likesQuery = `
    SELECT answer_id FROM likes WHERE user_id = ?
  `;

  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(nicknameQuery, [user_id], (nicknameError, nicknameResults) => {
      if (nicknameError) {
        console.error('Error retrieving nickname:', JSON.stringify(nicknameError, null, 2));
        return reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving nickname',
            error: nicknameError.message,
          }),
        });
      }

      const nickname = nicknameResults[0].nickname;

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

        connection.query(answersQuery, [user_id], (error, results) => {
          if (error) {
            console.error('Error retrieving answers:', JSON.stringify(error, null, 2));
            return reject({
              statusCode: 500,
              body: JSON.stringify({
                message: 'Error retrieving answers',
                error: error.message,
              }),
            });
          }

          connection.query(likesQuery, [currentUserId], (likeError, likeResults) => {
            if (likeError) {
              console.error('Error retrieving likes:', JSON.stringify(likeError, null, 2));
              return reject({
                statusCode: 500,
                body: JSON.stringify({
                  message: 'Error retrieving likes',
                  error: likeError.message,
                }),
              });
            }

            const likedAnswers = new Set(likeResults.map(row => row.answer_id));

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
                  keywords: row.keyword ? [row.keyword] : [],
                  liked: likedAnswers.has(row.answer_id), // 좋아요 여부 추가
                });
              }
              return acc;
            }, []);

            resolve({
              statusCode: 200,
              body: JSON.stringify({ nickname, isFollowing, answers }),
            });
          });
        });
      });
    });
  });
};
