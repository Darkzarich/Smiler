module.exports = {
  chainWebpack: (config) => {
    const apiRoute = process.env.API_URL;

    const defineModule = {
      'process.env': {
        NODE_ENV: `"${process.env.NODE_ENV}"`,
        VUE_APP_API_URL: `"${apiRoute || `http://localhost:${process.env.BACKEND_HOST_PORT || 3000}`}"`,
      },
    };

    config
      .plugin('define')
      .tap(() => [defineModule]);
  },
};
