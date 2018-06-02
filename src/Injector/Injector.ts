'use strict';
import chalk from 'chalk';
import assert from 'assert';
import autoBind from 'auto-bind';
import { isString, isObject } from 'util';
import { IInstance, IFactory, IMiddlewares, IEntityMiddleware, IMapDependency, IMiddlewareFunc, IBaseOptions, IDependencies, IFunctionalFactory, IInstanceConstructor, IConstructorFactory } from './interfaces';
import { LifeCycle } from './enums';

export class Injector {
  private instances: { [key: string]: IInstance };
  private factories: { [key: string]: IFactory };
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

  private _ensureDistinct(name: string) {
    const {
      instances,
      factories
    } = this;
    assert(factories[name] === undefined, 'Cannot overwrite a factory once registered.');
    assert(instances[name] === undefined, 'Cannot overwrite a service once registered.');
  }

  private _initMiddleware(name: string) {
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

  private inject(entity: IFactory, options: { additionalArguments?: any[] } = {}): IInstance {
    const self = this;
    const {
      get
    } = this;

    const {
      additionalArguments = []
    } = options;

    const {
      factory,
      depends: args = []
    } = entity;

    let dependents: any = get(args);

    if (!Array.isArray(dependents)) {
      dependents = [dependents];
    }

    const constructorArgs = [...dependents, ...additionalArguments];

    if (isFunctionalFactory(entity)) {
      const { factory } = entity;
      return factory(...constructorArgs);
    }

    if (isConstructorFactory(entity)) {
      const { factory } = entity;
      return new factory(...constructorArgs);
    }
  }

  public create = (name: string, arg?, ...otherArgs) => {
    const {
      get,
      factories,
      instances
    } = this;
    const self = this;

    if (!Array.isArray(arg)) {
      arg = [arg];
    }

    assert(factories[name] || (instances[name] && typeof instances[name].instance === 'function'), 'Factory or Service must be registered.');

    const deps = [...arg, ...otherArgs];
    if (factories[name]) {
      const entity = factories[name];
      const inst = this.get(name); // ensure all the static dependencies are there;
      const factoryArgs = this._formatCachedResults(entity.depends);
      let args;
      if (Array.isArray(factoryArgs)) {
        args = [...factoryArgs, ...deps];
      } else {
        args = [factoryArgs, ...deps];
      }

      const instance = this._constructFromCachedResults.apply(this, [entity, [...args]]);
      return instance;
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

  private _getArrayOfDependencies(deps: string[]): any[] {
    return deps.map((name: string) => this.get(name));
  }

  private _getMapOfDependencies(deps: IMapDependency = {}): { [key: string]: any } {
    const self = this;
    return Object.entries(deps).reduce((result, [key, name]) => {
      if (isString(name)) {
        result[key] = self.get(name);
        return result;
      }
      result[key] = name;
      return result;
    }, {});
  }

  private _isFactory = (key: string): boolean => {
    const { factories } = this;
    if (factories[key]) {
      return true;
    }
    return false;
  }

  /**
   * Gets a named instance if found, or constructs a factory and returns it from the container.
   * Overloads allow arrays or maps to be returned.
   * @param name - Dependency
   */
  public Oldget(name: IDependencies): any {
    const {
      _applyMiddleware,
      factories,
      inject,
      instances
    } = this;

    if (Array.isArray(name)) {
      return this._getArrayOfDependencies(name);
    }

    if (isObjectDependency(name)) {
      return this._getMapOfDependencies(name);
    }

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

  private _getDependencyArray = (dependencies: IDependencies): string[] => {
    let result;
    if (Array.isArray(dependencies)) {
      result = dependencies;
    }
    if (isString(dependencies)) {
      result = [dependencies];
    } else {
      result = Object.values<string>(dependencies);
    }
    return result;
  }

  public get = (dependencies: IDependencies) => {
    if (!dependencies) {
      return null;
    }
    const {
      instances,
      factories
    } = this;

    // const instances = {
    //   0:
    //     {
    //       name: '0',
    //       instance: 'FOO',
    //       depends: [],
    //       options: {}
    //     }
    // };
    // const factories = {
    //   1: {
    //     name: '1',
    //     factory: class Cat { },
    //     depends: ['0'],
    //     options: {}
    //   },
    // };

    const keys = this._getDependencyArray(dependencies);

    const queue = [...keys];
    
    /** 
     * Cache of instances.
     */
    const cache = instances;

    // const currentNode = keys[0];
    while (queue.length > 0) {
      const currentNode = queue.shift();

      // for object literal handling?
      if (!isString(currentNode)) {
        this.set(currentNode, currentNode);
      }

      // if it already is cached:
      if (cache[currentNode]) {
        continue;
      }

      if (!this.has(currentNode)) {
        throw new Error(`${currentNode} is not yet registered! You either misspelled the name or forgot to register it.`);
      }

      if (!this._isFactory(currentNode)) {
          const instance = this.instances[currentNode].instance;
          continue;
      }
      
      // its a factory


      const registeredFactory = this.factories[currentNode];
      const factoryDependencies = this._getDependencyArray(registeredFactory.depends);

      // if its not cached
      let depsNeedResolution = false;
      // queue up its unresolved dependencies
      for (const dep of factoryDependencies) {
        if (!cache[dep]) {
          if (!depsNeedResolution) {
            queue.unshift(currentNode);
          }
          depsNeedResolution = true;
          queue.unshift(dep);
        }
      }

      // sort out deps first, go back to queue
      if (depsNeedResolution) {
        continue;
      }

      const factoryArgs = this._formatCachedResults(registeredFactory.depends);
      const instance = this._constructFromCachedResults(registeredFactory, factoryArgs);

      cache[currentNode] =  {
        ...factories[currentNode],
        instance
      };
      // instances[name] =

      // return null;
      // if its a factory, for each dependency, 
      // check if its in the cache, 
      // if all dependencies are cached, instantiate a new instance
      // set it to the index of the results
      // if its not in the cache, 
      // push it into the queue
      // and then set current node to bottom of queue
    }
    
    this._runMiddleware(keys);
    return this._formatCachedResults(dependencies);
  }

  private _runMiddleware = (keys: string[]) => {
    const { _applyMiddleware, instances, factories } = this;
    for (const key of keys) {
      const entity = this._isFactory(key) ? factories[key] : instances[key];
      this._applyMiddleware(entity, LifeCycle.BEFORE);
      setTimeout(() => {
        _applyMiddleware(entity, LifeCycle.AFTER); // run after middleware on all instances
      });
    }
  }

  private _constructFromCachedResults<T = any>(factory: IFactory, results): IInstance<T> {
    if (isFunctionalFactory(factory)) {
      const { factory: Factory } = factory;
      if (Array.isArray(results)) {
        return Factory(...results);
      }
      return Factory(results);        
    } else if (isConstructorFactory(factory)) {
      const { factory: Factory } = factory;
      if (Array.isArray(results)) {
        return new Factory(...results);
      }
      return new Factory(results);
    }
  }

  private _formatCachedResults = (dependencies: IDependencies) => {
    const { instances } = this;
    if (Array.isArray(dependencies)) {
      return dependencies.map((x: string) => instances[x].instance);
    }

    if (isString(dependencies)) {
      return instances[dependencies].instance;
    }

    return Object.entries(dependencies).reduce((result, [key, name]) => {
      result[key] = instances[name].instance;
      return result;
    }, {});
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

function isFunctionalFactory(factory: any): factory is IFunctionalFactory {
  const { options = {} } = factory;
  return options.function === true;
}

function isConstructorFactory(factory: any): factory is IConstructorFactory {
  const { options = {} } = factory;
  return !options.function;
}
