const prisma = require('../../db/prisma/client');

async function createExchange(req, res, next) {
  try {
  } catch (error) {
    next(error);
  }
}

const shopsService = { createExchange };

module.exports = shopsService;
