const express = require('express');
const userService = require('./users.service');

const usersRouter = express.Router();

usersRouter.post('/sign-up', userService.signUp);
usersRouter.post('log-in', userService.logIn);
usersRouter.post('refresh-token', userService.refreshToken);

module.exports = usersRouter;
