'use strict';

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

module.exports.getFriendsTodayAnswers = async (event) => {
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

  const userId = decoded.userId;
  const today = new Date();
  const utc = today.getTime() + today.getTimezoneOffset() * 60000;
  const localToday = new Date(utc + 9 * 3600000); // KST 기준
  const formattedToday = `${localToday.getFullYear()}-${(localToday.getMonth() + 1).toString().padStart(2, '0')}-${localToday.getDate().toString().padStart(2, '0')}`;

  const query = `
    SELECT f.following_id AS friend_id, u.nickname, a.answer_id, a.answer, a.color, k.keyword, l.user_id AS liked
    FROM friends f
    JOIN users u ON f.following_id = u.user_id
    JOIN answers a ON f.following_id = a.user_id AND a.visibility = 'public' AND a.date = ?
    JOIN questions q ON a.date = q.date
    LEFT JOIN keywords k ON a.answer_id = k.answer_id
    LEFT JOIN likes l ON a.answer_id = l.answer_id AND l.user_id = ?
    WHERE f.follower_id = ?
  `;

  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [formattedToday, userId, userId], (error, results) => {
      if (error) {
        console.error('Error retrieving answers:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving answers',
            error: error.message,
          }),
        });
      } else {
        const answers = results.reduce((acc, row) => {
          let answer = acc.find(a => a.answer_id === row.answer_id);
          if (answer) {
            if (row.keyword) {
              answer.keywords.push(row.keyword);
            }
          } else {
            answer = {
              friend_id: row.friend_id,
              nickname: row.nickname,
              answer_id: row.answer_id,
              answer: row.answer,
              color: row.color,
              liked: !!row.liked,
              keywords: row.keyword ? [row.keyword] : [],
            };
            acc.push(answer);
          }
          return acc;
        }, []);

        resolve({
          statusCode: 200,
          body: JSON.stringify(answers),
        });
      }
    });
  });
};
