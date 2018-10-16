
import expect from 'expect';
import sinon, { SinonSandbox, SinonStubbedInstance } from 'sinon';
import { Injector } from './Injector';

/**
 * mocha src/Injector/integration.test.ts --opts .mocharc --watch
 */

describe('Injector Integration', () => {
  let injector: Injector;
  let sandbox: SinonSandbox;
  let logger: SinonStubbedInstance<Console>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    injector = new Injector();
    logger = sandbox.createStubInstance(console.Console);
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
    (foo as any).inject = ['baz'];
    injector.register('baz', result);
    injector.factory('foo', foo);
    expect(injector.get('foo').result).toEqual(result);
  });

  it('should enable middleware', () => {
    const result = 'baz';
    injector.middleware((x) => logger.log(`Resolving ${x.name}, Dependencies: ${x.depends}`));

    injector.middleware(() => logger.log());
    function baz(barley) {
      this.barley = barley;
    }
    (baz as any).inject = ['barley'];
    function foo(baz) {
      this.result = baz.barley;
    }
    (foo as any).inject = ['baz'];
    injector.register('barley', result);
    injector.factory('baz', baz);
    injector.factory('foo', foo);
    // tslint:disable-next-line:no-console
    injector.middleware((x) => console.log(`Resolved ${x.name} successfully!`));

    expect(injector.get('foo').result).toEqual(result);
    expect(logger.log.called).toBe(true, 'logger never called');
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
      injector.factory('foo', function({a, b}) {
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
      injector.factory('foo', function({a, b, bar}) {
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
