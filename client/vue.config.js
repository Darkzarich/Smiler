const localAPI = '"http://localhost:3000/api"';
const remoteAPI = '"https://dz-express-blog-api.herokuapp.com/api"';
const localStore = '"http://localhost:3000"';
const remoteStore = '"https://dz-express-blog-api.herokuapp.com"';

module.exports = {
  chainWebpack: (config) => {
    const defineModule = {
      'process.env': {
        NODE_ENV: '"development"',
        BASE_URL: '"/"',
        API_ROUTE: remoteAPI,
        STATIC_ROUTE: remoteStore,
      },
    };

    if (process.env.NODE_ENV === 'development' && process.env.SERVER_LOCAL) {
      defineModule['process.env'].API_ROUTE = localAPI;
      defineModule['process.env'].STATIC_ROUTE = localStore;
    }

    config
      .plugin('define')
      .tap(args => [defineModule]);
  },
};
