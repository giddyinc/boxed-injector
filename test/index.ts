
'use strict';

import expect from 'expect';
import * as mod from '../src';
import Injector from '../src/Injector';
import Locator from '../src/Locator';

// mocha --opts .mocharc test/**/*.ts

describe('boxed-injector', () => {
  describe('export', () => {
    it('Injector', () => {
      expect(mod.Injector).toExist();
    });
    it('Locator', () => {
      expect(mod.Locator).toExist();
    });
  });
  describe('individual exports', () => {
    it('Injector', () => {
      expect(Injector).toExist();
    });
    it('Locator', () => {
      expect(Locator).toExist();
    });
  });
});
