const express = require('express');
const usersRouter = require('./users/users.controller');
const shopsRouter = require('./shops/shops.controller');
const notificationsRouter = require('./notifications/notifications.controller');
const randomboxRouter = require('./randombox/randombox.controller');

const router = express.Router();

router.use('/users', usersRouter);
router.use('/shops', shopsRouter);
router.use('/notifications', notificationsRouter);
router.use('/randombox', randomboxRouter);

module.exports = router;
