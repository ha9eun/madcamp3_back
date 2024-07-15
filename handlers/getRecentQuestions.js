'use strict';

const { connectToDatabase } = require('../lib/db');

module.exports.getRecentQuestions = async (event) => {
  // 오늘, 어제, 그저께 날짜를 로컬 시간 기준으로 계산
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const today = new Date(utc + 9 * 3600000);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);

  // 날짜 부분만 추출하여 배열에 저장
  const dates = [
    `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`,
    `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`,
    `${dayBeforeYesterday.getFullYear()}-${(dayBeforeYesterday.getMonth() + 1).toString().padStart(2, '0')}-${dayBeforeYesterday.getDate().toString().padStart(2, '0')}`
  ];

  const query = 'SELECT * FROM questions WHERE DATE(date) IN (?, ?, ?)';
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, dates, (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving recent questions',
            error: error.message,
          }),
        });
      } else if (results.length === 0) {
        resolve({
          statusCode: 404,
          body: JSON.stringify({
            message: 'No questions found for the past three days',
          }),
        });
      } else {
        //결과의 날짜를 로컬 시간대로 변환
        const localResults = results.map(result => {
          const localDate = new Date(result.date);
          result.date = `${localDate.getFullYear()}-${(localDate.getMonth() + 1).toString().padStart(2, '0')}-${localDate.getDate().toString().padStart(2, '0')}`;
          return result;
        });

        resolve({
          statusCode: 200,
          body: JSON.stringify(localResults),
        });
      }
    });
  });
};
