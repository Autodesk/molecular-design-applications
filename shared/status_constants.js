const keyMirror = require('keymirror');

const statusConstants = keyMirror({
  IDLE: null,
  RUNNING: null,
  COMPLETED: null,
  ERROR: null,
  CANCELED: null,
});

module.exports = statusConstants;
