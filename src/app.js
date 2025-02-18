require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const router = require('./modules/index.controllers');
const middlewares = require('./modules/index.middlewares');

const app = express(); // 서버 생성
const PORT = 5050;

app.use(express.json());
app.use(morgan('combined'));
app.use(middlewares.authentication);
app.use(router);
app.use(middlewares.errorHandler);

app.listen(PORT, () => {
  console.log('Server Started to listen at 5050...');
});
