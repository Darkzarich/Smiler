module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Smiler Api', // Title (required)
    version: '1.0.0', // Version (required)
    // Description (optional)
    description: 'Smiler is my own MEVN (MongoDB, Express, Vue.js, Node.js) site similar to reddit.com or 9gag.com (mostly takes many known features) with many different and awesome features, open Swagger API docs, tests, interesting tools and more. Main reason of making this site is fun and learning new things while making it',
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
