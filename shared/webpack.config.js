const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: ['./main.js'],
  },
  output: {
    library: 'shared',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.js',
  },
  devServer: {
    port: '4000',
    hot: true,
    historyApiFallback: true,
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
      }, {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'eslint-loader',
      },
    ],
  },
  devtool: 'source-map',
  externals: [{
    keymirror: true,
  }],
};
