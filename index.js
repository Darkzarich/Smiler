const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const config = require('./src/config/config');

const Post = require('./src/model/post');

const app = express();
const { PORT } = config;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send('Hello world!');
});

app.get('/test', async (req, res) => {
  const posts = await Post.find({});
  res.status(200).json(posts);
});

app.post('/test', async (req, res) => {
  global.console.log(req.body);
  const post = await Post.create({
    ...req.body,
  });
  global.console.log(post);
  res.status(200).json(JSON.stringify(req.body));
});

app.listen(PORT, () => {
  global.console.log(`Server is listening on the port ${PORT}`);
});
