
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
      expect(injector.dependencies.foo).toEqual('bar', 'was expecting to be able to register instances.');
    });
  });
  describe('middleware', () => {
    it('should be able to register middleware - before', () => {
      injector.middleware('foo', (x, next) => {
        console.log(x);
        next();
      });
      injector.register('foo', 'bar');
      expect(injector.middlewares.foo).toExist('expected middleware to exist');
      expect(Array.isArray(injector.middlewares.foo.after)).toBe(true, 'expected middleware to be an array');
    });
    it('should be able to register middleware - after', () => {
      injector.register('foo', 'bar');
      injector.middleware('foo', (x, next) => {
        console.log(x);
        next();
      });
      expect(injector.middlewares.foo).toExist('expected middleware to exist');
      expect(Array.isArray(injector.middlewares.foo.after)).toBe(true, 'expected middleware to be an array');
    });
    // it('should run middleware on get - before', done => {
    //   sandbox.stub(console, 'log');
    //   injector.register('foo', 'bar');
    //   injector.middleware('foo', x => console.log(x));
    //   injector.get('foo');
    //   process.nextTick(() => {
    //     expect(console.log.called).toBe(true);
    //     expect(console.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
    //     done();
    //   });
    // });
    it('should run middleware on get - after', done => {
      sandbox.stub(console, 'log');
      injector.middleware('foo', () => console.log('bar'));
      injector.factory('foo', function () {
        return 'bar';
      });
      injector.get('foo');
      process.nextTick(() => {
        expect(console.log.called).toBe(true);
        expect(console.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
        done();
      });
    });

    it('should run middleware on get - global after', done => {
      sandbox.stub(console, 'log');
      injector.middleware(() => console.log('bar'));
      injector.factory('foo', function () {
        return 'bar';
      });
      injector.get('foo');
      process.nextTick(() => {
        expect(console.log.called).toBe(true);
        expect(console.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
        done();
      });
    });
    it('should fail if not passed a function 1 of 2 - invalid second arg', () => {
      expect(() => injector.middleware.call(null, ['foo', 'bar'])).toThrow(Error, 'was expecting to be able to register instances.');
    });
    it('should fail if not passed a function 2 of 2 - invalid first arg', () => {
      expect(() => injector.middleware.call(null, ['foo'])).toThrow(Error, 'was expecting to be able to register instances.');
    });
  });
  describe('factory', () => {
    it('should be able to register factories', () => {
      injector.factory('foo', function () {
        this.bar = 'baz';
      });
      expect(injector.get('foo').bar).toEqual('baz', 'was expecting to be able to get registered instances.');
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
      expect(injector.get('bar').foo).toEqual('abcd', 'was expecting to resolve dependencies.');
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
