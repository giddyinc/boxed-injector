
'use strict';

const expect = require('expect');

describe('boxed-injector', function () {
  describe('export', () => {
    let mod;
    beforeEach(() => {
      mod = require('../lib');
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
      const mod = require('../lib/Injector');
      expect(mod).toExist();
    });
    it('Locator', () => {
      const mod = require('../lib/Locator');
      expect(mod).toExist();
    });
  });
});
