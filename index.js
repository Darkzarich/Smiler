const express = require('express');

const app = express();
const PORT = 3000;

app.get('/test', (req, res) => {
  res.send('Hello World');
});

app.listen(PORT, () => {
  global.console.log(`Server is listening on the port ${PORT}`);
});
