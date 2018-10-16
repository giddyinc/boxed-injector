
import expect from 'expect';
import { Injector } from '../Injector/Injector';
import { get, set, isRegistered } from './Locator';

/**
 * to run standalone:
 * mocha src/Locator/Locator.test.ts --opts .mocharc --watch
 */

describe('Locator', () => {
  let injector: Injector;

  before(() => {
    injector = new Injector();
  });

  it('should throw if you get it without setting', () => {
    expect(get).toThrow(Error);
  });

  it('should expose a global setter', () => {
    expect(typeof set).toBe('function');
    set(injector);
    expect(typeof get()).toBe('object', 'not returning object');
  });

  it('should expose a global injector instance', () => {
    expect(get() instanceof Injector).toBe(true, 'getter method not working');
  });

  it('should be able to be required after-the-fact', () => {
    const another = require('./Locator');
    expect(another.get() instanceof Injector).toBe(true, 'separate require not working');
  });

  it('map implementation - support multiple injectors', () => {
    const Locator = require('./Locator');
    const injector = Locator.get();
    const second = new Injector();
    const key = 'second';
    expect(isRegistered()).toBe(true);
    expect(isRegistered(key)).toBe(false);
    Locator.set(key, second);
    expect(isRegistered(key)).toBe(true);
    expect(injector === second).toBe(false);
    (() => {
      const injector = Locator.get();
      const second = Locator.get('second'); 
      second.register('foo', 'baz');
      expect(injector === second).toBe(false);
      expect(isRegistered()).toBe(true);
      expect(isRegistered(key)).toBe(true);
      expect(isRegistered('third')).toBe(false);
    })();
  });

  it('getType', () => {
    injector.register('foo', 'bar');
    const Locator = require('./Locator');
    expect(Locator.getType('foo')).toEqual('bar');
    expect(Locator.getType('second', 'foo')).toEqual('baz');
  });

});
