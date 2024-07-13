'use strict';

const mysql = require('mysql');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let connection;

const connectToDatabase = () => {
  if (!connection) {
    connection = mysql.createConnection(dbConfig);
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
      }
    });
  }
  return connection;
};

module.exports.getAllQuestions = async (event) => {
  const query = 'SELECT * FROM Questions';
  connectToDatabase();

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing query:', JSON.stringify(error, null, 2));
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
