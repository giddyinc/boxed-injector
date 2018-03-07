'use strict';

const expect = require('expect');
const Injector = require('./Injector');
const sinon = require('sinon');

/**
 * mocha src/Injector/integration.test.js --watch
 */

describe('Injector Integration', () => {
  let injector;
  let sandbox;
  beforeEach(() => {
    injector = new Injector();
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('should work with instances', () => {
    const result = 'bar';
    injector.register('foo', result);
    expect(injector.get('foo')).toEqual(result);
  });

  it('should work with factories', () => {
    const result = 'bar';

    function foo() {
      this.result = result;
    }

    injector.factory('foo', foo);
    expect(injector.get('foo').result).toEqual(result);
  });

  it('should resolve', () => {
    const result = 'baz';
    function foo(baz) {
      this.result = baz;
    }
    foo.inject = ['baz'];
    injector.register('baz', result);
    injector.factory('foo', foo);
    expect(injector.get('foo').result).toEqual(result);
  });

  it('should enable middleware', () => {
    const result = 'baz';
    const logger = {
      log() { }
    };
    sandbox.stub(logger);
    injector.middleware(x => console.log(`Resolving ${x.name}, Dependencies: ${x.depends}`));

    injector.middleware(() => logger.log());
    function baz(barley) {
      this.barley = barley;
    }
    baz.inject = ['barley'];
    function foo(baz) {
      this.result = baz.barley;
    }
    foo.inject = ['baz'];
    injector.register('barley', result);
    injector.factory('baz', baz);
    injector.factory('foo', foo);
    injector.middleware(x => console.log(`Resolved ${x.name} successfully!`));

    expect(injector.get('foo').result).toEqual(result);
    expect(logger.log.called).toBe(true);
  });

  describe('map implementation', () => {
    const a = {};
    const b = {};
    const bar = 'bar';
    const depends = {
      a,
      b
    };

    it('map implementation', () => {
      injector.factory('foo', function ({a, b}) {
        this.a = a;
        this.b = b;
      }, {
        depends
      });
      const result = injector.get('foo');
      expect(result.a).toEqual(a);
      expect(result.b).toEqual(b);
    });

    it('string compat', () => {
      injector.register(bar, 'FOO');
      injector.factory('foo', function ({a, b, bar}) {
        this.a = a;
        this.b = b;
        this.bar = bar;
      }, {
        depends: {
          a,
          bar
        }
      });

      const result = injector.get('foo');
      expect(result.a).toEqual(a);
      expect(result.b).toNotExist();
      expect(result.bar).toEqual('FOO');
    });

  });

});

