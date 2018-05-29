'use strict';

import expect from 'expect';
import { Injector } from '../Injector/Injector';
import {
  get,
  set
} from './Locator';

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
});
