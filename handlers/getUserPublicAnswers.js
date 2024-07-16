'use strict';

const { connectToDatabase } = require('../lib/db');

module.exports.getUserPublicAnswers = async (event) => {
  const { user_id } = event.pathParameters;

  const query = `
    SELECT a.answer_id, a.date, q.question, a.answer, a.color, k.keyword, u.nickname
    FROM answers a
    JOIN questions q ON a.date = q.date
    LEFT JOIN keywords k ON a.answer_id = k.answer_id
    JOIN users u ON a.user_id = u.user_id
    WHERE a.user_id = ? AND a.visibility = 'public'
  `;
  
  const connection = connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, [user_id], (error, results) => {
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
          body: JSON.stringify(answers),
        });
      }
    });
  });
};
