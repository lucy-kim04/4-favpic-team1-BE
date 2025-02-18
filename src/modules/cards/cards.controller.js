const express = require('express');
const cardsRouter = express.Router();

cardsRouter.use('/cards');

module.exports = cardsRouter;
