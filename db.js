const mongoose = require('mongoose');

const password = process.env.mongoPassword;

mongoose.connect(`mongodb+srv://Darkzarich:${password}@expressrestblogtest-esklf.mongodb.net/test?retryWrites=true&w=majority`,
  { useNewUrlParser: true });

const db = mongoose.connection;

db.on('error', global.console.error.bind(console, 'connection error:'))
  .once('open', () => {
    global.console.log('Successfully connected to MongoDB database');
  });

module.exports.db = db;
