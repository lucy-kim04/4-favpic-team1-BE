const validator = require('validator');
const prisma = require('../../db/prisma/client');
const bcrypt = require('bcrypt');

async function signUp(req, res, next) {
  try {
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

const userService = { signUp, logIn, refreshToken };

module.exports = userService;
