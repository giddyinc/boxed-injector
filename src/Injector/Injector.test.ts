'use strict';

import expect from 'expect';
import sinon from 'sinon';
import { Injector } from './Injector';
import {
  Stereo,
  Boat,
  Bose,
  Car,
  types,
  PREFERRED_COLOR,
  PREFERRED_VOLUME,
  Motorcycle,
  Jetski,
} from '../../test/entities';

/**
 * mocha src/Injector/Injector.test.ts --opts .mocharc --watch
 */

describe('Injector', () => {
  let injector: Injector;
  let sandbox;
  let logger;

  beforeEach(() => {
    injector = new Injector();
    sandbox = sinon.createSandbox();
    logger = sandbox.createStubInstance(console.Console);
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('breakers', () => {

    it('self-referencing detection', () => {
      function Foo(foo) {
        this.foo = foo;
      }
      (Foo as any).inject = [
        'Foo'
      ];
  
      injector.factory('Foo', Foo);
      expect(() => injector.get('Foo')).toThrow();
    });

    it('circular dependency detection', () => {
      // tslint:disable-next-line:no-empty
      function Foo() {}
      (Foo as any).inject = [
        'Bar'
      ];
      // tslint:disable-next-line:no-empty
      function Bar() {}
      (Bar as any).inject = [
        'Baz'
      ];
      // tslint:disable-next-line:no-empty
      function Baz() {}
      (Baz as any).inject = [
        'Foo'
      ];
      
      injector.factory('Foo', Foo);
      injector.factory('Bar', Bar);
      injector.factory('Baz', Baz);
      // injector.get('Foo');
      expect(() => injector.get('Foo')).toThrow();
    });
  });

  describe('general', () => {
    it('should be a constructor', () => {
      expect(typeof injector).toEqual('object', 'was expecting an object.');
    });
  });
  describe('register', () => {
    it('should be able to register instances', () => {
      injector.register('foo', 'bar', { depends: 'bar' });
      expect(injector.graph('foo')).toEqual(['bar', 'foo']);
    });

    it('should be able to register instances', () => {
      injector.register('foo', 'bar');
      expect((injector as any).instances.foo.instance).toEqual('bar', 'was expecting to be able to register instances.');
    });

    it('should be able to register booleans', () => {
      injector.register('foo', true);
      injector.register('bar', false);
      expect((injector as any).instances.foo.instance).toEqual(true, 'was expecting to be able to register true bool.');
      expect((injector as any).instances.bar.instance).toEqual(false, 'was expecting to be able to register false bool.');
    });
  });

  describe('middleware', () => {
    it('should be able to register middlewares - before', () => {
      injector.middleware('foo', (x) => logger.log(x));
      injector.middleware((x) => logger.log(x));
      injector.register('foo', 'bar');
      const { middlewares }: any = injector;
      expect(middlewares.foo).toExist('expected middleware to exist');
      expect(Array.isArray(middlewares.foo.after)).toBe(true, 'expected middleware to be an array');
      expect(middlewares.foo.after.length).toBe(0, 'foo after length should be 0; both middlewares were registered before');
      expect(middlewares.__global__.before.length).toBe(1);
    });

    it('should be able to register middlewares - after', () => {
      injector.register('foo', 'bar');
      injector.middleware((x) => logger.log(x));
      injector.middleware('foo', (x) => logger.log(x));
      expect((injector as any).middlewares.foo).toExist('expected middleware to exist');
      expect(Array.isArray((injector as any).middlewares.foo.after)).toBe(true, 'expected middleware to be an array');
      expect((injector as any).middlewares.foo.before.length).toBe(0, 'should be able to register middleware before');
    });

    it('should run middleware on get - global before', () => {
      injector.middleware(() => logger.log('bar'));
      injector.factory('foo', function() {
        return 'bar';
      });
      injector.get('foo');
      expect(logger.log.called).toBe(true);
      expect(logger.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
    });

    it('should run middleware on get - global after', (done) => {
      injector.factory('foo', function() {
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
      injector.factory('foo', function() {
        return 'bar';
      });
      injector.get('foo');
      expect(logger.log.called).toBe(true);
      expect(logger.log.calledWith('bar')).toBe(true, 'was expecting console log to log x.');
    });
    it('should run middleware on get - entity after', (done) => {
      injector.factory('foo', function() {
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

    it('should run middleware in the correct order', (done) => {
      injector.middleware(() => logger.log('beforeGlobal'));
      injector.middleware('foo', () => logger.log('beforeEntity'));
      injector.factory('foo', function() {
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
      expect(() => (injector as any)._applyMiddleware.call(null, [{
        name: 'foo'
      }, 'baz'])).toThrow(Error, 'was expecting an error to be thrown.');
    });
  });
  describe('factory', () => {
    it('should be able to register factories', () => {
      injector.factory('foo', function() {
        this.bar = 'baz';
      });
      expect((injector as any).factories.foo.factory).toExist('was expecting to be able to get registered instances.');
    });

    it('should be able to add dependencies inline', () => {
      injector.register('asdf', 'asdf');

      injector.factory('foo', function(txt) {
        this.bar = txt;
      }, { depends: ['asdf'] });

      const result = injector.get('foo');
      expect(result.bar).toEqual('asdf');
    });

    it('should be able to add complex dependency graphs', () => {
      injector.register('asdf', 'asdf');
      injector.factory('a', () => 'a', { depends: [], function: true });

      injector.factory('b', function(txt) {
        this.bar = txt;
      }, { depends: 'a' });

      injector.factory('x', function(txt) {
        this.bar = txt.bar;
      }, { depends: 'b' });

      injector.factory('c', (txt) => txt, { depends: ['x'], function: true });
      injector.factory('d', (l) => l, { depends: ['c'], function: true });

      injector.factory('foo', function(txt) {
        this.bar = txt.bar;
      }, { depends: ['c'] });

      const result = injector.get('foo');
      expect(result.bar).toEqual('a');
    });
  });

  describe('graph', () => {
    it('should return empty [] for undef.', () => {
      const result = injector.graph('asdf');
      expect(result).toEqual([]);
    });

    it('should get a graph', () => {
      injector.register('asdf', 'asdf');
      injector.factory('a', () => 'a', { depends: [], function: true });
      injector.factory('g', () => 'g', { depends: [], function: true });
      injector.factory('b', (x) => x, { depends: 'a', function: true });
      injector.factory('c', (x) => x, { depends: ['b', 'a'], function: true });
      injector.factory('d', (x) => x, { depends: 'c', function: true });
      injector.factory('e', (x) => x, { depends: ['d', 'a'], function: true });
      injector.factory('f', (x) => x, { depends: ['d', 'g'], function: true });
      
      const d = 'd';
      const g = 'g';
      
      injector.factory('j', (x) => x, { depends: {
        d, g
      }, function: true });

      expect(injector.graph('a')).toEqual(['a']);
      expect(injector.graph('asdf')).toEqual(['asdf']);
      expect(injector.graph('b')).toEqual(['a', 'b']);
      expect(injector.graph('c')).toEqual(['a', 'b', 'c']);
      const eResult = injector.graph('e');
      expect(Array.isArray(eResult)).toBe(true);

      //   e
      // d   a
      // c   
      // b a
      expect(eResult).toEqual(['a', 'b', 'c', 'd', 'e'], 'unable to resolve e');

      
      // console.log('Graph Result', injector.graph(['e', 'f']));
      expect(injector.graph(['e', 'f'])).toEqual(['a', 'b', 'c', 'g', 'd', 'f', 'e'], 'e f');

      // console.log(injector.graph('f'));
      // console.log(injector.graph('j'));

      // expect(
      //   injector.graph('j')
      // ).toEqual(
      //   injector.graph('f')
      // );
    });


  });

  describe('get', () => {
    it('basic', () => {
      injector.register('0', 'foo');
      const result = injector.get('0');
      expect(result).toEqual('foo');
    });

    it('array, string, and map api', () => {

      injector.register(types.COLOR_CONFIG, PREFERRED_COLOR);
      injector.register(types.VOLUME_CONFIG, PREFERRED_VOLUME);
      
      //#region array
      injector.factory(types.Stereo, Stereo);
      injector.factory(types.Bose, Bose, {
        depends: [
          types.VOLUME_CONFIG,
          types.COLOR_CONFIG
        ]
      });
      //#endregion array
      //#region string
      injector.factory(types.Motorcycle, Motorcycle, {
        depends: types.Bose
      });

      injector.factory(types.Car, Car);
      //#endregion string

      //#region map
      injector.factory(types.Jetski, Jetski);
      injector.factory(types.Boat, Boat, {
        depends: {
          stereo: types.Bose,
          color: types.COLOR_CONFIG
        }
      });
      
      //#endregion map

      // inject array api
      const stereo = injector.get(types.Stereo);
      expect(stereo.volume).toEqual(PREFERRED_VOLUME);
      expect(stereo.color).toEqual(PREFERRED_COLOR);
      const bose = injector.get(types.Bose);
      expect(bose.volume).toEqual(PREFERRED_VOLUME);
      expect(bose.color).toEqual(PREFERRED_COLOR);

      // inject string api
      const car = injector.get(types.Car);
      expect(car.stereo).toEqual(bose);
      const motorcycle = injector.get(types.Motorcycle);
      expect(motorcycle.stereo).toEqual(bose);

      // get array api
      const [ a, b ] = injector.get([types.Car, types.Motorcycle]);
      expect(a).toEqual(car);
      expect(b).toEqual(motorcycle);

      const {
        foo,
        bar
      } = injector.get({
        foo: types.Car,
        bar: types.Motorcycle
      });
      expect(foo).toEqual(car);
      expect(bar).toEqual(motorcycle);

      // inject map api
      const boat = injector.get(types.Boat);
      expect(boat.stereo).toEqual(bose);
      expect(boat.color).toEqual(PREFERRED_COLOR);

      const jetski = injector.get(types.Jetski);
      expect(jetski.stereo).toEqual(bose);
      expect(jetski.color).toEqual(PREFERRED_COLOR);


      // expect(motorcycle.stereo).toEqual(bose);
      
      // console.log(injector.factories);

      // injector.factory('baz', );
      // const boat = injector.get(types.Boat);
      // expect(boat.color).toEqual(PREFERRED_COLOR);
      // expect(boat.stereo).toEqual(stereo);
      // console.log(injector.graph(types.Jetski));
      // console.log(injector.graph(types.Boat));
      // console.log(injector.graph(types.Motorcycle));

      expect(injector.graph(types.Motorcycle)).toEqual(['COLOR_CONFIG', 'VOLUME_CONFIG', 'Bose', types.Motorcycle]);

    });

    // it('graph', () => {

    // });


    
    it('should be able to get registered instances', () => {
      injector.register('foo', 'bar');
      expect(injector.get('foo')).toEqual('bar', 'was expecting to be able to get registered instances.');
    });
    it('should be able to get registered factories', () => {
      injector.factory('foo', function() {
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

      (factory as any).inject = ['foo'];

      injector.factory('bar', factory);
      const instance = injector.get('bar');
      expect(instance.foo).toEqual('abcd', 'was expecting to resolve dependencies.');
    });
  });

  describe('_ensureDistinct', () => {
    it('should throw an error if you try to overwrite a factory with another factory', () => {
      // tslint:disable-next-line:no-empty
      injector.factory('nonunique', function() { });
      // tslint:disable-next-line:no-empty
      expect(() => injector.factory('nonunique', function() { })).toThrow();
    });
    it('should throw an error if you try to overwrite a factory output with a service', () => {
      // tslint:disable-next-line:no-empty
      injector.factory('nonunique', function() { });
      // tslint:disable-next-line:no-empty
      expect(() => injector.register('nonunique', function() { })).toThrow();
    });
  });

  describe('create', () => {
    beforeEach(() => {
      function BMW(engine, color, interior) {
        this.make = 'BMW';
        this.engine = engine;
        this.color = color;
        this.interior = interior;
      }
      (BMW as any).inject = ['Engine'];
      injector.register('Engine', 'foo');
      injector.register('Ferarri', BMW);
      injector.factory('BMW', BMW);
    });
    it('should create an instance of a factory withArgs', () => {
      const instance1 = injector.create('BMW', 'black');
      expect(instance1.make).toBe('BMW');
      expect(instance1.color).toBe('black');
      expect(instance1.engine).toBe('foo');

      const instance2 = injector.create('BMW', ['white', 'leather']);
      expect(instance2.make).toBe('BMW');
      expect(instance2.engine).toBe('foo');
      expect(instance2.color).toBe('white');
      expect(instance2.interior).toBe('leather');
    });

    it('should create an instance of a using the object api', () => {
      function Mercedes({engine, daFunk}, color, interior) {
        this.make = 'CL500';
        this.daFunk = daFunk;
        this.engine = engine;
        this.color = color;
        this.interior = interior;
      }

      const myObjectLiteral = {};

      (Mercedes as any).inject = {
        engine: 'Engine',
        daFunk: myObjectLiteral
      };

      const type = 'Mercedes';
      injector.factory(type, Mercedes);

      const instance1 = injector.create(type, 'black');
      expect(instance1.make).toBe('CL500');
      expect(instance1.daFunk).toEqual(myObjectLiteral);
      expect(instance1.color).toBe('black');
      expect(instance1.engine).toBe('foo');

      const instance2 = injector.create(type, ['white', 'leather']);
      expect(instance2.engine).toBe('foo');
      expect(instance2.make).toBe('CL500');
      expect(instance2.color).toBe('white');
      expect(instance2.interior).toBe('leather');
    });

    it('should create an instance of a factory with multiple args instead of array', () => {
      const instance1 = injector.create('BMW', 'black');
      const instance2 = injector.create('BMW', 'white', 'leather');
      expect(instance1.make).toBe('BMW');
      expect(instance1.color).toBe('black');
      expect(instance2.make).toBe('BMW');
      expect(instance2.color).toBe('white');
      expect(instance1.engine).toBe('foo');
      expect(instance2.engine).toBe('foo');
      expect(instance2.interior).toBe('leather');
    });

    it('should create an instance of a service withArgs', () => {
      const instance1 = injector.create('Ferarri', ['hemi', 'red']);
      expect(instance1.color).toBe('red');
      expect(instance1.engine).toBe('hemi');
    });

    it('dont crash on no arr', () => {
      const instance1 = injector.create('BMW');
      expect(instance1.make).toBe('BMW');
    });
  });
  describe('set', () => {
    const name = 'foo';
    const thing = 'abcd';
    const otherThing = 'abcd';
    it('doesn\'t exist', () => {
      injector.set(name, thing);
      expect(injector.get(name)).toEqual(thing);
      injector.set(name, otherThing);
      expect(injector.get(name)).toEqual(otherThing);
    });
  });
  describe('has', () => {
    const name = 'foo';
    const thing = 'abcd';
    it('doesn\'t exist', () => {
      injector.factory(name, thing);
      expect(injector.has(name)).toEqual(true);
      expect(injector.has('bar')).toEqual(false);
    });
  });


  describe('_getDependencyArray', () => {
    it('object', () => {
      const inj: any = injector;
      const result = inj._getDependencyArray({
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      });
      expect(result).toEqual([
        'foo',
        'bar',
        'baz'
      ]);
    });
    it('arr', () => {
      const inj: any = injector;
      const result = inj._getDependencyArray([
        'foo',
        'bar',
        'baz'
      ]);
      expect(result).toEqual([
        'foo',
        'bar',
        'baz'
      ]);
    });
    it('arr', () => {
      const inj: any = injector;
      const result = inj._getDependencyArray(
        'foo',
      );
      expect(result).toEqual([
        'foo',
      ]);
    });
  });
});
