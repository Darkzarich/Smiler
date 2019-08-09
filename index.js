const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const config = require('./src/config/config');

const router = require('./src/routes');

const app = express();
const { PORT } = config;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(router);

app.listen(PORT, () => {
  global.console.log(`Server is listening on the port ${PORT}`);
});
