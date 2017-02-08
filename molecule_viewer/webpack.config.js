const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: ['./src/main.js'],
  },
  output: {
    library: 'shared',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loaders: ['imports-loader?define=>false', 'babel-loader'],
      }, {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'eslint-loader',
      },
    ],
  },
  devtool: 'source-map',
  externals: [{
    three: true,
    xhr2: true,
    fs: true,
  }],
};
