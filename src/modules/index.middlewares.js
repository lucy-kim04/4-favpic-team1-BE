const jwt = require('jsonwebtoken');

function errorHandler(err, req, res, next) {
  console.error('에러 발생...', err);

  let [statusCode, message] = err.message.split('/');
  statusCode = Number(statusCode);

  if (isNaN(statusCode)) return res.status(500).send('Unknown error');

  res.status(statusCode).send(message);
}

// 토큰 유효성을 체크하는 미들웨어
function authentication(req, res, next) {
  try {
    // 토큰 체크를 하지 않아야 하는 요청
    if (
      req.url === '/users/sign-up' ||
      req.url === '/users/log-in' ||
      req.url === '/users/check-nickname'
    )
      return next();
    const authorization = req.headers.authorization;
    if (!authorization) return next();
    const accessToken = authorization.split('Bearer ')[1];
    if (!accessToken) return res.status(400).send('Wrong token received...');

    const { sub } = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    req.userId = sub;

    next();
  } catch (error) {
    // 인증 실패
    // 만료 기간이 지난 경우
    if (error.name === 'TokenExpiredError') {
      return res.status(419).json({
        code: 419,
        message: 'Token expired',
      });
    }
    // 토큰의 비밀키가 일치하지 않는 경우
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: 'Invalid token',
      });
    }
  }
}

// 로그인 여부만 체크하는 미들웨어
function loggedInOnly(req, res, next) {
  try {
    const isLoggedIn = !!req.userId;

    if (!isLoggedIn) throw new Error('400/Login required');

    next();
  } catch (error) {
    next(error);
  }
}

const middlewares = {
  errorHandler,
  authentication,
  loggedInOnly,
};

module.exports = middlewares;
