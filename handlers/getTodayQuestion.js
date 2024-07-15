'use strict';

const { connectToDatabase } = require('../lib/db');

module.exports.getTodayQuestion = async (event) => {
  // 오늘 날짜를 로컬 시간 기준으로 계산
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const today = new Date(utc + 9 * 3600000);

  // 오늘 날짜의 년, 월, 일을 추출하여 문자열로 형식화
  const todayDateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const query = 'SELECT * FROM questions WHERE DATE(date) = ?';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [todayDateString], (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving today\'s questions',
            error: error.message,
          }),
        });
      } else if (results.length === 0) {
        resolve({
          statusCode: 404,
          body: JSON.stringify({
            message: 'No question found for today',
          }),
        });
      } else {
        // 결과의 날짜를 로컬 시간대로 변환
        const localResult = {
          ...results[0],
          date: todayDateString
        };

        resolve({
          statusCode: 200,
          body: JSON.stringify(localResult),
        });
      }
    });
  });
};
