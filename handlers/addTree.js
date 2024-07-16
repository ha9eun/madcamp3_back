'use strict';

const {PutObjectCommand, S3Client} = require('@aws-sdk/client-s3');

const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/verifyToken');

const client = new S3Client({});

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
//   console.log("이미지: ",image_data);
  if (!image_data) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'image_data is required',
      }),
    };
  }
  const imageName = `${decoded.userId}_tree.jpg`;

  const buffer = Buffer.from(image_data, 'base64');
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: imageName,
    Body: buffer,
  });console.log("test");

  try {
    //const s3Response = await s3.putObject(params).promise();
    const response = await client.send(command);

    console.log('업로드 완료');
    const imageUrl = `dc8i0y2u993j2.cloudfront.net/${imageName}`;

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
