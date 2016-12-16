"use strict";
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const appConstants = require('./constants/app_constants');
const workflowRouter = require('./workflow');
const versionRouter = require('./version');

/********************************
 * Create the server
 ********************************/
var app = express();

/*******************************
 * Express boilerplate middlewares
 ********************************/
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/* Serve client files */
app.use(express.static(path.join(__dirname, 'client/dist')));

/********************************
 * Add server routes
 ********************************/
app.use(`${appConstants.VERSION_PREFIX}/workflow`, workflowRouter);
app.use('/version', versionRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // return error json, only providing error in development
  res.status(err.status || 500);
  return res.send({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
  });
});

module.exports = app;
