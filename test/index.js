
'use strict';

const expect = require('expect');

describe('boxed-injector', function () {
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
