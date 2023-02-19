module.exports = {
  chainWebpack: (config) => {
    const apiRoute = process.env.API_URL;

    const defineModule = {
      'process.env': {
        NODE_ENV: `"${process.env.NODE_ENV}"`,
        VUE_APP_API_URL: `"${apiRoute || ''}"`,
      },
    };

    config
      .plugin('define')
      .tap(() => [defineModule]);

    // vue-cli-service dev proxy, proxy all /api requests to API_ROUTE
    config
      .devServer
      .proxy({
        '/api': {
          target: apiRoute || `http://localhost:${process.env.BACKEND_HOST_PORT || 3000}`,
        },
      });
  },
};
