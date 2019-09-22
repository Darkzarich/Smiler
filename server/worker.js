const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const db = require('./db');
const config = require('./src/config/config');


const router = require('./src/routes');

const app = express();
const { PORT } = config;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: db,
    }),
  }),
);

app.use(router);

if (config.IS_PRODUCTION) {
  console.log('!!!!!!!!!!!!!1');
  app.use('/app/uploads', express.static(path.join(__dirname, 'uploads')));
} else {
  console.log('!!!!!!!!!!!!!2');
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

app.listen(PORT, () => {
  global.console.log(`${process.pid} [pid]: Server is listening on the port ${PORT}`);
});
