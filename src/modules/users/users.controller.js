const express = require('express');
const userService = require('./users.service');
const middlewares = require('../index.middlewares');

const usersRouter = express.Router();

usersRouter.post('/sign-up', userService.signUp);
usersRouter.post('/log-in', userService.logIn);
usersRouter.post('/refresh-token', userService.refreshToken);
usersRouter.post('/check-nickname', userService.checkIsAvailableNickname);
usersRouter.get('/', userService.getUsers);
usersRouter.get('/me', middlewares.loggedInOnly, userService.getMe);
usersRouter.put('/me/point', middlewares.loggedInOnly, userService.addPoint);
usersRouter.put(
  '/me/record-time',
  middlewares.loggedInOnly,
  userService.recordLastDrawingTime
);

module.exports = usersRouter;
