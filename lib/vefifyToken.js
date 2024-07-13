const jwt = require('jsonwebtoken');

module.exports.verifyToken = (event) => {
  const token = event.headers.Authorization && event.headers.Authorization.split(' ')[1];

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Unauthorized',
      }),
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      statusCode: 200,
      user: decoded,
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Unauthorized',
        error: error.message,
      }),
    };
  }
};
