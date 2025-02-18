const express = require('express');
const userService = require('./users.service');
const middlewares = require('../index.middlewares');
const multer = require('multer');

const usersRouter = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/');
  },
  filename: function (req, file, cb) {
    console.log(file);
    const extension = file.originalname.split('.').slice(-1)[0];
    cb(null, 'product' + '-' + Date.now() + '.' + extension);
  },
});

const upload = multer({ storage: storage });

const uploadMiddleware = upload.single('imgUrl');

usersRouter.post('/sign-up', userService.signUp);
usersRouter.post('/log-in', userService.logIn);
usersRouter.post('/refresh-token', userService.refreshToken);
usersRouter.post('/check-nickname', userService.checkIsAvailableNickname);
usersRouter.get('/', userService.getUsers);
usersRouter.get('/me', middlewares.loggedInOnly, userService.getMe);
usersRouter.post('/me/cards', uploadMiddleware, userService.createCard);

module.exports = usersRouter;
