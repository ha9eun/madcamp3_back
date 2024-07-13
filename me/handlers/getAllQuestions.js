'use strict';

const mysql = require('mysql');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const connection = mysql.createConnection(dbConfig);

module.exports.getAllQuestions = async (event) => {
  const query = 'SELECT * FROM questions';

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: 'Error retrieving questions',
            error: error.message,
          }),
        });
      } else {
        resolve({
          statusCode: 200,
          body: JSON.stringify(results),
        });
      }
    });
  });
};
