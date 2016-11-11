// import assert from 'assert';
// import boxedInjector from '../lib';

'use strict';

const expect = require('expect');

describe('boxed-injector', function () {
  describe('export', () => {
    let mod;
    beforeEach(() => {
      mod = require('../lib');
    });
    it('Injectable', () => {
      expect(mod.Injectable).toExist();
    });
    it('Injector', () => {
      expect(mod.Injector).toExist();
    });
    it('Inject', () => {
      expect(mod.Inject).toExist();
    });
    it('Locator', () => {
      expect(mod.Locator).toExist();
    });
  });
  describe('individual exports', () => {
    it('Injectable', () => {
      const mod = require('../lib/Injectable');
      expect(mod).toExist();
    });
    it('Injector', () => {
      const mod = require('../lib/Injector');
      expect(mod).toExist();
    });
    it('Inject', () => {
      const mod = require('../lib/Inject');
      expect(mod).toExist();
    });
    it('Locator', () => {
      const mod = require('../lib/Locator');
      expect(mod).toExist();
    });
  });
});
