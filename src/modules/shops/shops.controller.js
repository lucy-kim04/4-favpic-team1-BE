const express = require('express');
const shopsService = require('./shops.service');

const shopsRouter = express.Router();

shopsRouter.post('/:shopId/exchange', shopsService.createExchange);

module.exports = shopsRouter;
