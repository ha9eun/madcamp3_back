'use strict';

const mysql = require('mysql');
require('dotenv').config();
console.log('db.js');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

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
        console.error('Error connecting to the database:', JSON.stringify(err, null, 2));
        throw new Error('Database connection failed');
      } else {
        console.log('Successfully connected to the database');
      }
    });
  }
  return connection;
};

module.exports = {
  connectToDatabase,
};
