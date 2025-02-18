const express = require('express');
const cardsService = require('./cards.service');
const cardsRouter = express.Router();
const multer = require('multer');
const { loggedInOnly } = require('../index.middlewares');

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

cardsRouter.post('/', uploadMiddleware, cardsService.createCard);
cardsRouter.get('/me/gallery', cardsService.getMyCardsOfGallery);

module.exports = cardsRouter;
