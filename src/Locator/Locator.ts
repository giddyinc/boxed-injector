
import Injector from '..';

/**
 * This is a temporary workaround. Globals are bad mmmkay!
 */

let _instance: Injector;

const set = function (injector: Injector): void {
  _instance = injector;
};

const get = function (): Injector {
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

export default {
  set,
  get
}