const validator = require('validator');
const prisma = require('../../db/prisma/client');
const bcrypt = require('bcrypt');

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
      data: { email, encryptedPassword, nickname, point: 0 },
      omit: { encryptedPassword: true },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

async function logIn(req, res, next) {
  try {
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
  } catch (error) {
    next(error);
  }
}

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

async function checkNicknameExists(req, res, next) {
  try {
    const nickname = req.body.nickname;

    if (!validator.isLength(nickname, { min: 2, max: 15 }))
      throw new Error('400/Too short or Too long nickname');

    const existingNickname = await prisma.user.findUnique({
      where: { nickname },
    });

    if (existingNickname) {
      res.status(200).send('Nickname already in use');
    } else {
      res.status(200).send('Available nickname');
    }
  } catch (error) {
    next(error);
  }
}

const userService = {
  signUp,
  logIn,
  refreshToken,
  checkNicknameExists,
  getUsers,
};

module.exports = userService;
