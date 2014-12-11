var Promise = require('bluebird');

Promise.onPossiblyUnhandledRejection(function (err) {
  throw err;
});
