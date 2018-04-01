'use strict';

import assert from 'assert';
import autoBind from 'auto-bind';

type IMiddlewareFunc = (x: any) => any;

export interface IBaseOptions {
  depends?: Array<string> | string | { [key: string]: any }
}

export interface IEntityMiddleware {
  before: any[];
  after: any[];
}

export interface IGlobalMiddlewares {
  [key: string]: any[]
}

export interface IMiddlewares {
  [key: string]: IEntityMiddleware
}

export interface IInstance {
  name: string;
  instance?: any;
  depends: Array<string> | string | { [key: string]: any };
}

export interface IFactory extends IInstance {
  name: string;
  instance?: any;
  depends: Array<string> | { [key: string]: any };
  factory: new (...any) => IInstance;
  options: any
}

export class Injector {
  public instances: { [key: string]: IInstance };
  public factories: { [key: string]: IFactory };
  private globalStr: string;
  private middlewares: any;

  constructor() {
    this.instances = {};
    this.factories = {};
    this.globalStr = '__global__';

    this.middlewares = {
      [this.globalStr]: []
    };

    autoBind(this);
  }

  private _applyMiddleware(entity, lifecycle: LifeCycle) {
    const {
      globalStr,
      middlewares
    } = this;

    const entityMiddleware: IEntityMiddleware = middlewares[entity.name];
    const globalMiddleware = middlewares[globalStr];

    const run = middlewares => {
      middlewares.forEach(middleware => middleware(entity));
    };

    if (lifecycle === LifeCycle.BEFORE) {
      if (entityMiddleware) {
        run(entityMiddleware.before);
      }
    } else if (lifecycle === LifeCycle.AFTER) {
      const globalAfter = globalMiddleware
        .filter(x => {
          return (!entityMiddleware.before.includes(x) && !entityMiddleware.after.includes(x));
        });
      run(entityMiddleware.after.concat(globalAfter));
    } else {
      throw new Error('Invalid lifecycle method.');
    }
  }

  _ensureDistinct(name: string) {
    const {
      instances,
      factories
    } = this;
    assert(factories[name] === undefined, 'Cannot overwrite a factory once registered.');
    assert(instances[name] === undefined, 'Cannot overwrite a service once registered.');
  }

  _initMiddleware(name: string) {
    const {
      globalStr,
      middleware,
      middlewares
    } = this;

    if (!middlewares[name]) {
      middlewares[name] = {
        before: [],
        after: []
      };
      middlewares[globalStr].forEach(method => middleware(name, method));
    }
  }

  unset(key: string) {
    const {
      instances,
      factories
    } = this;
    Object.assign(instances, {
      [key]: undefined
    });
    Object.assign(factories, {
      [key]: undefined
    });
    return this;
  }

  set(key, value) {
    const {
      has,
      unset,
      register
    } = this;

    if (has(key)) {
      unset(key);
    }
    return register(key, value);
  }

  has(key: string) {
    const {
      instances,
      factories
    } = this;
    return Boolean(factories[key] || instances[key]);
  }

  factory(name: string, factory, options: IBaseOptions = {}) {
    const {
      _ensureDistinct,
      _initMiddleware,
      factories
    } = this;

    assert(name, 'Invalid name. Factories must be registered with a valid unique string.');

    _ensureDistinct(name);
    _initMiddleware(name);

    let depends = options.depends || factory.inject;

    if (!depends) {
      depends = [];
    }

    if (!Array.isArray(depends) && typeof depends === 'string') {
      depends = [depends];
    }

    factories[name] = {
      name,
      factory,
      depends,
      options
    };

    return this;
  }

  register(name: string, instance, options: IBaseOptions = { depends: [] }) {
    const {
      _ensureDistinct,
      _initMiddleware,
      instances
    } = this;
    let {
      depends = []
    } = options;
    assert(name, 'Invalid name. Instances must be registered with a valid unique string.');

    _ensureDistinct(name);
    _initMiddleware(name);

    if (!Array.isArray(depends)) {
      depends = [depends];
    }

    instances[name] = {
      name,
      instance,
      depends
    };

    return this;
  }

  inject(entity) {
    const {
      get
    } = this;
    const {
      factory,
      depends: args = [],
      options
    } = entity;

    // handle array of dependencies
    if (Array.isArray(args)) {
      const deps = args.map(dependency => get(dependency));
      if (options.function) {
        return factory(...deps);
      }

      return new factory(...deps); /* eslint new-cap:0 */
    }

    // map values to either object (if object literal) or if its a string
    // and the key === value, treat it as a registered entity
    const dep = Object.keys(args).reduce((all, next) => {
      const val = args[next];
      all[next] = (typeof val === 'string' && val === next) ? get(val) : val;
      return all;
    }, {});

    if (options.function) {
      return factory(dep);
    }
    return new factory(dep); /* eslint new-cap:0 */
  }

  create(name, otherArgs) {
    const {
      get,
      factories,
      instances
    } = this;

    if (arguments.length > 2) {
      otherArgs = [...arguments].slice(1);
    }

    assert(factories[name] || (instances[name] && typeof instances[name].instance === 'function'), 'Factory or Service must be registered.');

    if (factories[name]) {
      const entity = factories[name];
      const Factory = entity.factory;
      const args = entity.depends || [];
      const resolvedDeps = args.map(dependency => get(dependency));
      const merged = [].concat(resolvedDeps, otherArgs);
      return new Factory(...merged);
    }
    const Instance = instances[name].instance;
    return new Instance(...otherArgs);
  }

  graph(name, nested?: boolean) {
    const {
      factories,
      has,
      instances
    } = this;

    const defaultObj = {
      all: [],
      hash: {}
    };
    if (!Array.isArray(name) && !has(name)) {
      if (nested) {
        return defaultObj;
      }
      return [];
    }

    const entityKeys = Array.isArray(name) ? name : [name];
    const deps = entityKeys.reduce((children, key) => {
      const entity = factories[key] ? factories[key] : instances[key];
      return children.concat(entity.depends);
    }, []);

    const graph = deps.reduce((obj, elem) => {
      const add = e => {
        if (!obj.hash[e]) {
          obj.all.push(e);
          obj.hash[e] = true;
        }
      };

      add(elem);
      const child = this.graph(elem, true);
      child.all.forEach(childDep => {
        add(childDep);
      });

      return obj;
    }, defaultObj);

    if (!nested) {
      return graph.all;
    }

    return graph;
  }

  get(name) {
    const {
      _applyMiddleware,
      factories,
      inject,
      instances
    } = this;

    let isFactory = false;

    if (factories[name]) {
      isFactory = true;
    }

    if (!instances[name]) {
      assert(factories[name], `${name} is not yet registered! You either misspelled the name or forgot to register it.`);
      assert(typeof factories[name].factory === 'function', `${name} is not a constructor. Try declaring as an instance instead of a factory.`);
      const entity = factories[name];
      _applyMiddleware(entity, LifeCycle.BEFORE); // run before middleware on factory - only runs once
      instances[name] = Object.assign({}, factories[name], {
        instance: inject(entity)
      });
    }

    const instanceEntity = instances[name];
    if (!isFactory) {
      _applyMiddleware(instanceEntity, LifeCycle.BEFORE); // run before middleware on instance
    }

    setTimeout(() => {
      _applyMiddleware(instanceEntity, LifeCycle.AFTER); // run after middleware on all instances
    });

    return instanceEntity.instance;
  }

  middleware(name: string | IMiddlewareFunc, method?: IMiddlewareFunc) {
    const {
      _initMiddleware,
      factories,
      instances,
      globalStr,
      middlewares
    } = this;

    if (typeof name === 'function') {
      method = name;
      name = globalStr;
    }

    assert(typeof method === 'function', 'Middleware must be passed a function.');

    if (name === globalStr) {
      middlewares[name].push(method);
      return this;
    }

    if (!middlewares[name]) {
      _initMiddleware(name);
    }

    // if service or factory isn't registered, run middleware before get
    if (!instances[name] && !factories[name]) {
      // run before all gets
      middlewares[name].before.push(method);
    } else {
      // run after all gets
      // if global middlewares exist, that arent in before / after already, queue them up
      const globals = middlewares[globalStr].filter(x => {
        return (!middlewares[name].before.includes(x) && !middlewares[name].after.includes(x));
      });

      middlewares[name].after = middlewares[name].after.concat(globals);
      middlewares[name].after.push(method);
    }

    return this;
  }

}

function isEntityMiddleware(mw: any): mw is IEntityMiddleware {
  return Array.isArray(mw) === false;
}

enum LifeCycle {
  BEFORE = 'before',
  AFTER = 'after'
}
