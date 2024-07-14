const jwt = require('jsonwebtoken');

module.exports.verifyToken = (token) => {
  console.log("splited token:",token);
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
