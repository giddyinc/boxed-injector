'use strict';

const expect = require('expect');
const Injector = require('./Injector');
const sinon = require('sinon');

/**
 * mocha lib/Injector/integration.test.js --watch
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
      log() {}
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
});
