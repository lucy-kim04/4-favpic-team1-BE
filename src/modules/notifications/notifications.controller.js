const express = require('express');
const middlewares = require('../index.middlewares');
const notificationsService = require('./notifications.service');

const notificationsRouter = express.Router();

notificationsRouter.post(
  '/',
  middlewares.loggedInOnly,
  notificationsService.sendNotification
);
notificationsRouter.get(
  '/me',
  middlewares.loggedInOnly,
  notificationsService.getNotificationsOfMe
);

module.exports = notificationsRouter;
