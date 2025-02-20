const express = require('express');
const shopsService = require('./shops.service');
const middlewares = require('../index.middlewares');

const shopsRouter = express.Router();

shopsRouter.post('/:shopId/exchange', shopsService.createExchange);
shopsRouter.post('/', middlewares.loggedInOnly, shopsService.createShop);
shopsRouter.get('/', shopsService.getShops);
shopsRouter.get('/:shopId', middlewares.loggedInOnly, shopsService.getShop);

module.exports = shopsRouter;
