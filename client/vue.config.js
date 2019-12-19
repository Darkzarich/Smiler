const localAPI = '"http://localhost:3000/api"';
const remoteAPI = '"https://dz-express-blog-api.herokuapp.com/api"';
const localStore = '"http://localhost:3000"';
const remoteStore = '"https://dz-express-blog-api.herokuapp.com"';

module.exports = {
  chainWebpack: config => {

    const defineModule = {
      'process.env': {
        NODE_ENV: '"development"',
        BASE_URL: '"/"'
      }
    }

    if (process.env.NODE_ENV === 'development') {

      if (process.env.SERVER_LOCAL) {
        defineModule["process.env"].API_ROUTE = localAPI;
        defineModule["process.env"].STATIC_ROUTE = localStore;
      } else {
        defineModule["process.env"].API_ROUTE = remoteAPI;
        defineModule["process.env"].STATIC_ROUTE = remoteStore;
      }

      config
        .plugin('define')
          .tap( args => [defineModule])
    }
  }
}
