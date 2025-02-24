require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// const bodyParser = require('body-parser');
const router = require('./modules/index.controllers');
const middlewares = require('./modules/index.middlewares');

const app = express(); // 서버 생성
const PORT = 5050;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(middlewares.authentication);
// app.use(bodyParser.json());
app.use(morgan('combined'));
app.use('/static', express.static('public')); // 이미지 경로 설정
app.use(router);
app.use(middlewares.errorHandler);

app.listen(PORT, () => {
  console.log('Server Started to listen at 5050...');
});
