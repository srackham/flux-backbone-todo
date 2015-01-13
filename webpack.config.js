var webpack = require('webpack');

module.exports = {
  cache: true,
  entry: './app/app.jsx',
  output: {
    path: __dirname + '/app',
    filename: 'app.js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.less$/,
        loader: 'style!css!less'
      },
      {
        test: /\.jsx$/,
        loader: '6to5-loader',
        query: {modules: 'common'}
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  }
};
