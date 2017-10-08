'use strict';

import expect from 'expect';
import Injector from '../Injector/Injector';

/**
 * to run standalone:
 * mocha --require babel-register src/Locator/Locator.test.js --watch
 */

describe('Locator', () => {
  let injector: Injector;
  let store;

  before(() => {
    injector = new Injector();
    store = require('./Locator');
  });

  it('should throw if you get it without setting', () => {
    expect(store.get).toThrow(Error);
  });

  it('should expose a global setter', () => {
    expect(typeof store.set).toBe('function');
    store.set(injector);
    expect(typeof store.get()).toBe('object', 'not returning object');
  });

  it('should expose a global injector instance', () => {
    expect(store.get() instanceof Injector).toBe(true, 'getter method not working');
  });

  it('should be able to be required after-the-fact', () => {
    const another = require('./Locator');
    expect(another.get() instanceof Injector).toBe(true, 'separate require not working');
  });
});
