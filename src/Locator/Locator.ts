
'use strict';

import { Injector } from '../Injector/Injector';

/**
 * This should always be a temporary workaround. Globals are bad mmmkay!
 */

let _instance: Injector;

export const set = (injector: Injector): void => {
  _instance = injector;
};

export const get = (): Injector => {
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
