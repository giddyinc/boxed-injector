
'use strict';
const expect = require('expect');
const Injector = require('../Injector/Injector').default;

/**
 * to run standalone:
 * mocha --require babel-register lib/Locator/Locator.test.js --watch
 */

describe('Locator', () => {
  let injector;
  let store;

  before(() => {
    injector = new Injector();
    store = require('./Locator');
  });

  it('should expose a global setter', () => {
    expect(typeof store.get()).toEqual('undefined', 'defaulting to object');
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
