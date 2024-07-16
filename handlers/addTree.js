'use strict';

const AWS = require('aws-sdk');
const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

const s3 = new AWS.S3();
const BUCKET_NAME = 'me-dev-serverlessdeploymentbucket-ujmmb8d7yufl';

module.exports.addTree = async (event) => {
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

  const { image_data } = JSON.parse(event.body);
  console.log("이미지: ",image_data);
  if (!image_data) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'image_data is required',
      }),
    };
  }

  const buffer = Buffer.from(image_data, 'base64');
  const params = {
    Bucket: BUCKET_NAME,
    Key: decoded.userId,
    Body: buffer,
    ContentType: 'image/jpeg'
  };

  try {
    await s3.putObject(params).promise();
    console.log('업로드 완료');
    const imageUrl = `dc8i0y2u993j2.cloudfront.net/${decoded.userId}`;

    const query = 'INSERT INTO users (user_id, tree) VALUES (?, ?)';
    const connection = await connectToDatabase();

    return new Promise((resolve, reject) => {
      connection.query(query, [decoded.userId, imageUrl], (error, results) => {
        if (error) {
          console.error('Error executing query:', JSON.stringify(error, null, 2));
          reject({
            statusCode: 500,
            body: JSON.stringify({
              message: 'Error adding tree',
              error: error.message,
            }),
          });
        } else {
          resolve({
            statusCode: 201,
            body: JSON.stringify({
              message: 'Tree added successfully',
              answerId: results.insertId,
            }),
          });
        }
      });
    });
  } catch (error) {
    console.error('Error uploading image to S3 or saving to DB:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error uploading image or saving to database',
        error: error.message,
      }),
    };
  }
};
