const express = require('express');
const shopsService = require('./shops.service');
const middlewares = require('../index.middlewares');

const shopsRouter = express.Router();

shopsRouter.post('/', middlewares.loggedInOnly, shopsService.createShop);
shopsRouter.post(
  '/:shopId/exchanges',
  middlewares.loggedInOnly,
  shopsService.proposeExchange
);
shopsRouter.post(
  '/:shopId/purchase',
  middlewares.loggedInOnly,
  shopsService.purchaseCards
);
shopsRouter.get('/', shopsService.getShops);
shopsRouter.get('/:shopId', middlewares.loggedInOnly, shopsService.getShop);
shopsRouter.put('/:shopId', shopsService.updateShop);
shopsRouter.get(
  '/:shopId/exchanges',
  middlewares.loggedInOnly,
  shopsService.getExchangesOfShop
);
shopsRouter.get(
  '/:shopId/my-exchanges',
  middlewares.loggedInOnly,
  shopsService.getMyExchangesOfShop
);
shopsRouter.delete(
  '/:shopId',
  middlewares.loggedInOnly,
  shopsService.deleteShop
);
shopsRouter.put(
  '/exchanges/:exchangeId',
  middlewares.loggedInOnly,
  shopsService.cancelProposeExchange
);
shopsRouter.post(
  '/exchanges/:exchangeId/approve',
  middlewares.loggedInOnly,
  shopsService.approveExchange
);

module.exports = shopsRouter;
