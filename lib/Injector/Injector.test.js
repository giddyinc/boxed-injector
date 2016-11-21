
const expect = require('expect');
const Injector = require('./Injector');

/**
 * to run standalone:
 * mocha --require babel-register lib/Injector/Injector.test.js --watch
 */

describe('Injector', () => {
  let injector;
  beforeEach(() => {
    injector = new Injector();
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
