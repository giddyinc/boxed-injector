
'use strict';

const expect = require('expect');
const sinon = require('sinon');
const Injector = require('./Injector');

/**
 * to run standalone:
 * mocha --require babel-register lib/Injector/Injector.test.js --watch
 */

describe('Injector', () => {
  let injector;
  let sandbox;
  beforeEach(() => {
    injector = new Injector();
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('general', () => {
    it('should be a constructor', () => {
      expect(typeof injector).toEqual('object', 'was expecting an object.');
    });
  });
  describe('register', () => {
    it('should be able to register instances', () => {
      injector.register('foo', 'bar');
      expect(injector.instances.foo.instance).toEqual('bar', 'was expecting to be able to register instances.');
    });
    it('should be able to register booleans', () => {
      injector.register('foo', true);
      injector.register('bar', false);
      expect(injector.instances.foo.instance).toEqual(true, 'was expecting to be able to register true bool.');
      expect(injector.instances.bar.instance).toEqual(false, 'was expecting to be able to register false bool.');
    });
  });
  describe('middleware', () => {
    let logger = {
      log() {}
    };
    beforeEach(() => {
      sandbox.stub(logger, 'log');
    });
    it('should be able to register middlewares - before', () => {
      injector.middleware('foo', x => logger.log(x));
      injector.middleware(x => logger.log(x));
      injector.register('foo', 'bar');
      expect(injector.middlewares.foo).toExist('expected middleware to exist');
      expect(Array.isArray(injector.middlewares.foo.after)).toBe(true, 'expected middleware to be an array');
      expect(injector.middlewares.foo.after.length).toBe(0);
      expect(injector.middlewares.__global__.length).toBe(1);
    });

    it('should be able to register middlewares - after', () => {
      injector.register('foo', 'bar');
      injector.middleware(x => logger.log(x));
      injector.middleware('foo', x => logger.log(x));
      expect(injector.middlewares.foo).toExist('expected middleware to exist');
      expect(Array.isArray(injector.middlewares.foo.after)).toBe(true, 'expected middleware to be an array');
      expect(injector.middlewares.foo.before.length).toBe(0);
      expect(injector.middlewares.__global__.length).toBe(1);
    });

    it('should run middleware on get - global before', () => {
      injector.middleware(() => logger.log('bar'));
      injector.factory('foo', function () {
        return 'bar';
      });
      injector.get('foo');
      expect(logger.log.called).toBe(true);
      expect(logger.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
    });
    it('should run middleware on get - global after', done => {
      injector.factory('foo', function () {
        return 'bar';
      });
      injector.middleware(() => logger.log('bar'));
      injector.get('foo');
      setTimeout(() => {
        expect(logger.log.called).toBe(true);
        expect(logger.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
        done();
      }, 10);
    });
    it('should run middleware on get - entity before', () => {
      injector.middleware('foo', () => logger.log('bar'));
      injector.factory('foo', function () {
        return 'bar';
      });
      injector.get('foo');
      expect(logger.log.called).toBe(true);
      expect(logger.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
    });
    it('should run middleware on get - entity after', done => {
      injector.factory('foo', function () {
        return 'bar';
      });
      injector.middleware('foo', () => logger.log('bar'));
      injector.get('foo');
      setTimeout(() => {
        expect(logger.log.called).toBe(true);
        expect(logger.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
        done();
      }, 10);
    });

    it('should run middleware in the correct order', done => {
      injector.middleware(() => logger.log('beforeGlobal'));
      injector.middleware('foo', () => logger.log('beforeEntity'));
      injector.factory('foo', function () {
        return 'bar';
      });
      injector.middleware(() => logger.log('afterGlobal'));
      injector.middleware('foo', () => logger.log('afterEntity'));
      injector.get('foo');
      setTimeout(() => {
        expect(logger.log.called).toBe(true);
        expect(logger.log.firstCall.calledWith('beforeGlobal')).toBe(true, 'was expecting beforeGlobal.');
        expect(logger.log.secondCall.calledWith('beforeEntity')).toBe(true, 'was expecting console log to log afterLog.');
        expect(logger.log.thirdCall.calledWith('afterGlobal')).toBe(true, 'was expecting afterGlobal.');
        expect(logger.log.lastCall.calledWith('afterEntity')).toBe(true, 'was expecting afterEntity.');
        done();
      }, 30);
    });

    it('should fail if not passed a function 1 of 2 - invalid second arg', () => {
      expect(() => injector.middleware.call(null, ['foo', 'bar'])).toThrow(Error, 'was expecting to be able to register instances.');
    });

    it('should fail if not passed a function 2 of 2 - invalid first arg', () => {
      expect(() => injector.middleware.call(null, ['foo'])).toThrow(Error, 'was expecting to be able to register instances.');
    });
  });
  describe('_applyMiddleware', () => {
    it('should fail if not passed valid arg', () => {
      expect(() => injector._applyMiddleware.call(null, [{name: 'foo'}, 'baz'])).toThrow(Error, 'was expecting an error to be thrown.');
    });
  });
  describe('factory', () => {
    it('should be able to register factories', () => {
      injector.factory('foo', function () {
        this.bar = 'baz';
      });
      expect(injector.factories.foo.factory).toExist('was expecting to be able to get registered instances.');
    });
  });

  describe('get', () => {
    it('should be able to get registered instances', () => {
      injector.register('foo', 'bar');
      expect(injector.get('foo')).toEqual('bar', 'was expecting to be able to get registered instances.');
    });
    it('should be able to get registered factories', () => {
      injector.factory('foo', function () {
        this.bar = 'baz';
      });
      expect(injector.get('foo').bar).toEqual('baz', 'was expecting to be able to get registered instances.');
    });
    it('should throw an error if the module doesn\'t exist', () => {
      const getter = () => injector.get('foo');
      expect(getter).toThrow();
    });
    it('should be automatically resolve child dependencies', () => {
      injector.register('foo', 'abcd');
      function factory(foo) {
        this.foo = foo;
      }
      factory.inject = ['foo'];

      injector.factory('bar', factory);
      const instance = injector.get('bar');
      expect(instance.foo).toEqual('abcd', 'was expecting to resolve dependencies.');
    });
  });

  describe('_ensureDistinct', () => {
    it('should throw an error if you try to overwrite a factory with another factory', () => {
      injector.factory('nonunique', function () { });
      expect(() => injector.factory('nonunique', function () { })).toThrow();
    });
    it('should throw an error if you try to overwrite a factory output with a service', () => {
      injector.factory('nonunique', function () { });
      expect(() => injector.register('nonunique', function () { })).toThrow();
    });
  });
});
