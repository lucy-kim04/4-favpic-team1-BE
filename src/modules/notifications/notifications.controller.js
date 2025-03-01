const express = require('express');
const middlewares = require('../index.middlewares');
const notificationsService = require('./notifications.service');

const notificationsRouter = express.Router();

notificationsRouter.post(
  '/notifications',
  middlewares.loggedInOnly,
  notificationsService.sendNotification
);
notificationsRouter.get(
  '/notifications/me',
  middlewares.loggedInOnly,
  notificationsService.getNotificationsOfMe
);

module.exports = notificationsRouter;
