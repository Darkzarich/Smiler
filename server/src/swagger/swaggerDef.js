module.exports = {
  openapi: '3.0.0',
  info: {
    // API informations (requireds
    title: 'Smiler Api', // Title (required)
    version: '1.0.0', // Version (required)
    description: 'An open API to my own MEVN (MongoDB, Express, Vue.js, Node.js) site similar to reddit.com or pikabu.ru (mostly copies many pikabu features) with many different and awesome features, open swagger API documentation. Main reason of making this site is fun and learning new things while making it', // Description (optional)
  },
  servers: [
    {
      url: 'https://smiler-api.darkzarich.com/api',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Local server',
    },
  ],
  apis: ['src/routes/api/*.js', 'src/routes/*.js'],
};
