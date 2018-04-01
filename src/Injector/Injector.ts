'use strict';
import chalk from 'chalk';
import assert from 'assert';
import autoBind from 'auto-bind';
import { isString, isObject } from 'util';
import { IInstance, IFactory, IMiddlewares, IEntityMiddleware, IMapDependency, IMiddlewareFunc, IBaseOptions, IDependency } from './intefaces';
import { LifeCycle } from './enums';

export class Injector {
  public instances: { [key: string]: IInstance };
  public factories: { [key: string]: IFactory };
  private readonly globalStr: string;
  private middlewares: IMiddlewares;

  constructor() {
    this.instances = {};
    this.factories = {};
    this.globalStr = '__global__';

    this.middlewares = {
      [this.globalStr]: {
        before: [],
        after: []
      }
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

    const run = (middlewares: IMiddlewareFunc[]) => {
      middlewares.forEach((middleware) => middleware(entity));
    };

    if (lifecycle === LifeCycle.BEFORE) {
      if (entityMiddleware) {
        run(entityMiddleware.before);
      }
    } else if (lifecycle === LifeCycle.AFTER) {
      const globalAfter = globalMiddleware
        .after
        .filter((x) => {
          return (!entityMiddleware.before.includes(x) && !entityMiddleware.after.includes(x));
        });
      run(entityMiddleware.after.concat(globalAfter));
    } else {
      throw new Error('Invalid lifecycle method.');
    }
  }

  public _ensureDistinct(name: string) {
    const {
      instances,
      factories
    } = this;
    assert(factories[name] === undefined, 'Cannot overwrite a factory once registered.');
    assert(instances[name] === undefined, 'Cannot overwrite a service once registered.');
  }

  public _initMiddleware(name: string) {
    const {
      globalStr,
      middleware,
      middlewares
    } = this;

    const globalMiddleware: IEntityMiddleware = middlewares[globalStr];

    if (!middlewares[name]) {
      const { before: globalBefore } = globalMiddleware;
      middlewares[name] = {
        before: [...globalBefore],
        after: []
      };
      // middlewares[globalStr].before.forEach((method) => middleware(name, method));
      return;
    }
    // after middleware will get handled in the register global
  }

  public unset(key: string): this {
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

  public set(key: string, value: any): this {
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

  public has(key: string): boolean {
    const {
      instances,
      factories
    } = this;
    return Boolean(factories[key] || instances[key]);
  }

  public factory(name: string, factory, options: IBaseOptions = {}) {
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

  public register(name: string, instance: any, options: IBaseOptions = { depends: [] }): this {
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
      depends,
      options: {}
    };

    return this;
  }

  private inject(entity) {
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
      const deps = args.map((dependency) => get(dependency));
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

  public create(name: string, arg?, ...otherArgs) {
    const {
      get,
      factories,
      instances
    } = this;

    if (!Array.isArray(arg)) {
      arg = [arg];
    }

    const deps = [...arg, ...otherArgs];

    assert(factories[name] || (instances[name] && typeof instances[name].instance === 'function'), 'Factory or Service must be registered.');

    if (factories[name]) {
      const entity = factories[name];
      const Factory = entity.factory;
      const args: IDependency = entity.depends || [];

      // todo: handle map deps
      const resolvedDeps = args.map((dependency) => get(dependency));
      const merged = [].concat(resolvedDeps, deps);
      return new Factory(...merged);
    }
    const Instance = instances[name].instance;
    return new Instance(...deps);
  }

  public graph(name, nested?: boolean) {
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
      const add = (e) => {
        if (!obj.hash[e]) {
          obj.all.push(e);
          obj.hash[e] = true;
        }
      };

      add(elem);
      const child = this.graph(elem, true);
      child.all.forEach((childDep) => {
        add(childDep);
      });

      return obj;
    }, defaultObj);

    if (!nested) {
      return graph.all;
    }

    return graph;
  }

  public get(name: string): any {
    const {
      _applyMiddleware,
      factories,
      inject,
      instances
    } = this;

    let isFactory: boolean = false;

    if (factories[name]) {
      isFactory = true;
    }

    if (!instances[name]) {
      assert(factories[name], `${name} is not yet registered! You either misspelled the name or forgot to register it.`);
      const { factory } = factories[name];
      if (typeof factory !== 'function') {
        throw new TypeError(`${name} is not a constructor. Try declaring as an instance instead of a factory.`);
      }
      const entity = factories[name];
      _applyMiddleware(entity, LifeCycle.BEFORE); // run before middleware on factory - only runs once
      instances[name] = {
        ...factories[name],
        instance: inject(entity)
      };
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


  private _registerGlobalMiddleware(middleware: IMiddlewareFunc): this {
    const {
      globalStr,
      middlewares,
      instances,
      factories
    } = this;

    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function.');
    }

    const registeredEntities = {
      ...factories,
      ...instances
    };

    // for entities that are already registered, this will run after the fact
    Object.entries(middlewares).forEach(([instance, { after }]) => {
      // never add to global after
      if (instance === globalStr) {
        return;
      }
      // if the entity is registered as an instance or a factory, 
      // add it to the afterwards middleware
      if (registeredEntities[instance]) {
        after.push(middleware);
      }
    });
    middlewares[globalStr].before.push(middleware);
    return this;
  }

  /**
   * Register a middleware function.
   * @param name - Registered Instance / Factory name
   * @param method - Middleware Function
   */
  public middleware(name: string | IMiddlewareFunc, method?: IMiddlewareFunc): this {
    const {
      _initMiddleware,
      factories,
      instances,
      globalStr,
      middlewares
    } = this;

    if (!isString(name)) {
      return this._registerGlobalMiddleware(name);
    }

    if (!method) {
      throw new TypeError('Middleware method is required');
    }

    if (typeof method !== 'function') {
      throw new TypeError('Middleware must be passed a function.');
    }

    if (!middlewares[name]) {
      _initMiddleware(name);
    }

    // if service or factory isn't registered, run middleware before get
    if (!instances[name] && !factories[name]) {
      // run before all gets
      middlewares[name].before.push(method);
    } else {
      // factory/service exists already, global middleware is already in place
      // run after all injector.get()
      // if global middlewares exist, that arent in before / after already, queue them up

      const { after } = middlewares[name];
      middlewares[name].after = [...after, method];
    }

    return this;
  }

}

function isObjectDependency(e: any): e is IMapDependency {
  return !Array.isArray(e) && !isString(e) && isObject(e);
}
function isEntityMiddleware(mw: any): mw is IEntityMiddleware {
  return Array.isArray(mw) === false;
}
