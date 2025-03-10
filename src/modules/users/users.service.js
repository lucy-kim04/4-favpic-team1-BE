const validator = require('validator');
const prisma = require('../../db/prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pid } = require('process');

const jwtSecretKey = process.env.JWT_SECRET_KEY;

// 회원가입
async function signUp(req, res, next) {
  try {
    const { email, password, nickname } = req.body;

    if (!validator.isEmail(email)) throw new Error('400/Malformed email');
    if (!validator.isLength(password, { min: 8 }))
      throw new Error('400/Password should be at least 8 characters');
    if (!validator.isLength(nickname, { min: 2, max: 15 }))
      throw new Error('400/Too short or Too long nickname');

    // 회원가입 로직
    // 1. 이미 가입된 email인지 확인
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) throw new Error('400/Email already in use');

    // 2. 이미 사용중인 nickname인지 확인
    // - 프론트엔드에서 중복체크를 하더라도 다시 한 번 하는게 맞겠지?
    const existingNickname = await prisma.user.findUnique({
      where: { nickname },
    });
    if (existingNickname) throw new Error('400/Nickname already in use');

    // 3. 비밀번호 암호화
    const encryptedPassword = await bcrypt.hash(password, 12);

    // 4. 유저 생성(포인트 추가)
    const user = await prisma.user.create({
      data: { email, encryptedPassword, nickname, point: 50 },
      omit: { encryptedPassword: true },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

// 로그인
async function logIn(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. 가입된 유저인지 확인
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('400/Non existing user');

    // 2. 비밀번호가 맞는지 확인
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.encryptedPassword
    );
    if (!isPasswordCorrect) throw new Error('400/Wrong password');

    // 3. 토큰 발급
    const payload = {
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    };
    const accessToken = jwt.sign(payload, jwtSecretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, jwtSecretKey, { expiresIn: '7d' });

    const resData = { accessToken, refreshToken };

    res.status(200).json(resData);
  } catch (error) {
    next(error);
  }
}

// 토큰 재발급
async function refreshToken(req, res, next) {
  try {
    const { prevRefreshToken } = req.body;
    console.log(prevRefreshToken, jwtSecretKey);
    const { sub, email, nickname } = jwt.verify(prevRefreshToken, jwtSecretKey);
    console.log(sub);
    // 받아온 payload에서 iat, exp는 제외(있으면 중복값이라 에러 발생)
    const payload = { sub, email, nickname };
    const accessToken = jwt.sign(payload, jwtSecretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, jwtSecretKey, { expiresIn: '7d' });

    const data = { accessToken, refreshToken };

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    if (error instanceof jwt.JsonWebTokenError) {
      const error = new Error('400/Invalid token in refresh');

      return next(error);
    }
    next(error);
  }
}

// 내 정보 조회
async function getMe(req, res, next) {
  try {
    const userId = req.userId;
    const me = await prisma.user.findUnique({
      where: { id: userId },
      omit: { encryptedPassword: true },
    });

    res.status(200).json(me);
  } catch (error) {
    next(error);
  }
}

// 사용자 목록 조회
async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      omit: { encryptedPassword: true },
    });
    res.status(200).send(users);
  } catch (error) {
    next(error);
  }
}

// 닉네임 중복 체크
async function checkIsAvailableNickname(req, res, next) {
  try {
    const nickname = req.body.nickname;

    if (!validator.isLength(nickname, { min: 2, max: 15 }))
      throw new Error('400/Too short or Too long nickname');

    const existingNickname = await prisma.user.findUnique({
      where: { nickname },
    });

    if (existingNickname) {
      res.status(200).send(false);
    } else {
      res.status(200).send(true);
    }
  } catch (error) {
    next(error);
  }
}

// 포인트 추가
async function addPoint(req, res, next) {
  try {
    const userId = req.userId;
    const point = req.body.point;

    await prisma.user.update({
      where: { id: userId },
      data: { point: { increment: point } },
    });

    res.status(200).send('AddPoint success');
  } catch (error) {
    next(error);
  }
}

// 랜덤 박스 추첨 시각을 기록
async function recordLastDrawingTime(req, res, next) {
  try {
    const userId = req.userId;

    const time = new Date().getTime();
    console.log(time);
    await prisma.user.update({
      where: { id: userId },
      data: { lastDrawingTime: new Date() },
    });

    res.status(200).send('Save success');
  } catch (error) {
    next(error);
  }
}

// '마이갤러리' 상단의 summary count 조회
async function getMyGallerySummary(req, res, next) {
  try {
    const userId = req.userId;
    console.log(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        cardEditions: {
          where: { status: 'inPossesion' },
          select: { card: { select: { grade: true } } },
        },
        _count: {
          select: { cardEditions: { where: { status: 'inPossesion' } } },
        },
      },
    });

    const myGallerySummary = {
      COMMON: 0,
      RARE: 0,
      'SUPER RARE': 0,
      LEGENDARY: 0,
    };
    user.cardEditions.forEach(
      (edition) => (myGallerySummary[edition.card.grade] += 1)
    );

    const totalCount = user._count.cardEditions;

    res.status(200).json({ userSummary: myGallerySummary, totalCount });
  } catch (error) {
    next(error);
  }
}

// '나의 판매 포토카드' 상단의 summary count 조회
async function getMySalesSummary(req, res, next) {
  try {
    const userId = req.userId;
    console.log(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        cardEditions: {
          where: { NOT: { status: 'inPossesion' } },
          select: { card: { select: { grade: true, name: true, id: true } } },
        },
        _count: {
          select: {
            cardEditions: { where: { NOT: { status: 'inPossesion' } } },
          },
        },
      },
    });

    const myGallerySummary = {
      COMMON: 0,
      RARE: 0,
      'SUPER RARE': 0,
      LEGENDARY: 0,
    };
    user.cardEditions.forEach(
      (edition) => (myGallerySummary[edition.card.grade] += 1)
    );

    const totalCount = user._count.cardEditions;

    res.status(200).json({
      userSummary: myGallerySummary,
      totalCount,
      cardEditions: user.cardEditions,
    });
  } catch (error) {
    next(error);
  }
}

const userService = {
  signUp,
  logIn,
  refreshToken,
  getMe,
  getUsers,
  checkIsAvailableNickname,
  addPoint,
  recordLastDrawingTime,
  getMyGallerySummary,
  getMySalesSummary,
};

module.exports = userService;
