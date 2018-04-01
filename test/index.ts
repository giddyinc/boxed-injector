
'use strict';

import expect from 'expect';
import { Injector, Locator } from '..';

// mocha test/index.ts --opts .mocharc --watch

describe('boxed-injector', () => {
  describe('sanity', () => {
    it('should work', () => {
      const injector = new Injector();
      expect(Locator.get).toExist();
      expect(Locator.set).toExist();
    });
  });
  describe('export', () => {
    let mod;
    beforeEach(() => {
      mod = require('../src');
    });
    it('Injector', () => {
      expect(mod.Injector).toExist();
    });
    it('Locator', () => {
      expect(mod.Locator).toExist();
    });
  });
  describe('individual exports', () => {
    it('Injector', () => {
      const mod = require('../src/Injector');
      expect(mod).toExist();
    });
    it('Locator', () => {
      const mod = require('../src/Locator');
      expect(mod).toExist();
    });
  });
});
