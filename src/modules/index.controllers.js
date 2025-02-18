const express = require('express');
const usersRouter = require('./users/users.controller');
const shopsRouter = require('./shops/shops.controller');
const notificationsRouter = require('./notifications/notifications.controller');
const randomboxRouter = require('./randombox/randombox.controller');
const cardsRouter = require('./cards/cards.controller');

const router = express.Router();

router.use('/users', usersRouter);
router.use('/cards', cardsRouter);
router.use('/shops', shopsRouter);
router.use('/notifications', notificationsRouter);
router.use('/randombox', randomboxRouter);

module.exports = router;
