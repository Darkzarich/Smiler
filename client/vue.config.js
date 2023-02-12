module.exports = {
  chainWebpack: (config) => {
    const defineModule = {
      'process.env': {
        NODE_ENV: `"${process.env.NODE_ENV}"`,
        API_ROUTE: `"${process.env.API_ROUTE || 'http://localhost:3000'}"`,
      },
    };

    config
      .plugin('define')
      .tap(() => [defineModule]);
  },
};
