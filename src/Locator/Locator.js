'use strict';

/**
 * This is a temporary workaround. Globals are bad mmmkay!
 */

let _instance;

module.exports.set = function (injector) {
  _instance = injector;
};

module.exports.get = function () {
  if (!_instance) {
    console.error(`
      Injector has not yet been registered in the service locator. 
      Ensure Locator.set(injector); is called prior to Locator.get. 
      Beware of sync require calls.
      `);
    throw new Error('Injector Not Registered');
  }
  return _instance;
};
