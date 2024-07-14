const jwt = require('jsonwebtoken');

module.exports.verifyToken = (event) => {
  const token = event.headers.Authorization && event.headers.Authorization.split(' ')[1];

  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Unauthorized');
  }
};
