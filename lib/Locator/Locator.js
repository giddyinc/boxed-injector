
'use strict';

/**
 * This is a temporary workaround. Globals are bad mmmkay!
 */

let _instance;

module.exports.set = function (injector) {
  _instance = injector;
};

module.exports.get = function () {
  return _instance;
};
