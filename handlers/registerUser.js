'use strict';

const { connectToDatabase } = require('../lib/db');

module.exports.registerUser = async (event) => {
  const { userId, nickname, password } = JSON.parse(event.body);

  if (!userId || !nickname || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'UserId, password and nickname are required',
      }),
    };
  }

  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    // 먼저 아이디 중복 여부를 확인하는 쿼리 실행
    const checkQuery = 'SELECT COUNT(*) as count FROM users WHERE user_id = ?';
    connection.query(checkQuery, [userId], (checkError, checkResults) => {
      if (checkError) {
        console.error('Error executing check query:', JSON.stringify(checkError, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error checking user ID',
            error: checkError.message,
          }),
        });
      } else {
        const count = checkResults[0].count;
        if (count > 0) {
          // 아이디가 중복된 경우
          resolve({
            statusCode: 409,
            body: JSON.stringify({
              message: 'UserId already exists',
            }),
          });
        } else {
          // 아이디가 중복되지 않은 경우 새로운 사용자 등록
          const query = 'INSERT INTO users (user_id, nickname, password) VALUES (?, ?, ?)';
          const values = [userId, nickname, password];
          connection.query(query, values, (error, results) => {
            if (error) {
              console.error('Error executing insert query:', JSON.stringify(error, null, 2));
              reject({
                statusCode: 500,
                body: JSON.stringify({
                  message: 'Error registering user',
                  error: error.message,
                }),
              });
            } else {
              resolve({
                statusCode: 201,
                body: JSON.stringify({
                  message: 'User registered successfully',
                  userId: results.insertId,
                }),
              });
            }
          });
        }
      }
    });
  });
};
