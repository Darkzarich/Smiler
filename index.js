const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/test', (req, res) => {
  res.status(200).send('Hello World');
});

app.post('/test', (req, res) => {
  res.status(200).json(JSON.stringify(req.body));
});

app.listen(PORT, () => {
  global.console.log(`Server is listening on the port ${PORT}`);
});
