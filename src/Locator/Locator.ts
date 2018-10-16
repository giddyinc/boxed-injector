
import { Injector } from '../Injector/Injector';
import { isString } from 'util';

let _instance: Injector;
const _injectors: { [key: string]: Injector } = {};

export function set(injector: Injector): void;
export function set(key: string | Injector, injector?: Injector): void {
  if (isString(key)) {
    if (injector == null) {
      throw new TypeError('Injector is required.');
    }
    _injectors[key] = injector;
    return;
  }
  _instance = key;
  return;
}

const logMsg = `
Injector has not yet been registered in the service locator. 
Ensure Locator.set(injector); is called prior to Locator.get. 
Beware of sync require calls.
`;

const errMsg = 'Injector Not Registered';

export const get = (key?: string): Injector => {
  if (key != null && isString(key)) {
    if (_injectors[key] == null) {
      // tslint:disable-next-line:no-console
      console.error(logMsg);
      throw new Error(errMsg);
    }
    return _injectors[key];
  }

  if (!_instance) {
    // tslint:disable-next-line:no-console
    console.error(logMsg);
    throw new Error(errMsg);
  }

  return _instance;
};

export const isRegistered = (key?: string): boolean => {
  if (key != null && isString(key)) {
    return _injectors[key] != null;
  }
  return _instance != null;
};

export function getType<T = any>(type: string): T;
export function getType<T = any>(injectorKey: string, type?: string): T {
  let injector: Injector;
  if (type == null) {
    injector = get();
    type = injectorKey;
  } else {
    injector = get(injectorKey);
  }
  return injector.get(type);
}
