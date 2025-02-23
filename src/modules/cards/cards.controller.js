const express = require('express');
const cardsService = require('./cards.service');
const cardsRouter = express.Router();
const multer = require('multer');
const { loggedInOnly } = require('../index.middlewares');
const middlewares = require('../index.middlewares');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/');
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.split('.').slice(-1)[0];
    cb(null, 'product' + '-' + Date.now() + '.' + extension);
  },
});

const upload = multer({ storage: storage });

const uploadMiddleware = upload.single('imgUrl');

cardsRouter.post(
  '/',
  middlewares.loggedInOnly,
  uploadMiddleware,
  cardsService.createCard
);
cardsRouter.get(
  '/me/gallery',
  middlewares.loggedInOnly,
  cardsService.getMyCardsOfGallery
);
cardsRouter.get(
  '/me/gallery/:cardId',
  middlewares.loggedInOnly,
  cardsService.getMyCardOfGallery
);
cardsRouter.get(
  '/me/sales',
  middlewares.loggedInOnly,
  cardsService.getMyCardsOfSales
);

module.exports = cardsRouter;
