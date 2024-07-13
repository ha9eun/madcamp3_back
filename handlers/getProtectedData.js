'use strict';

const { verifyToken } = require('../lib/verifyToken');

module.exports.getProtectedData = async (event) => {
  const authResult = verifyToken(event);

  if (authResult.statusCode !== 200) {
    return authResult;
  }

  // 인증된 사용자만 접근 가능한 데이터 처리 로직
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Protected data access successful',
      user: authResult.user,
    }),
  };
};
