
import assert from 'assert';
import { LifeCycle } from './enums';
import { IBaseOptions, IConstructorFactory, IDependencies, IEntityMiddleware, IFactory, IFunctionalFactory, IInstance, IMiddlewareFunc, IMiddlewares } from './interfaces';

export interface InjectorOptions {
  cyclicDependencyThreshhold?: number;
  middlewareEnabled?: boolean;
}

export class Injector<T = { [key: string]: any }> {
  private instances; // : { [key: string]: IInstance };
  private factories; // { [key: string]: IFactory };
  private readonly globalStr: string;
  private middlewares: IMiddlewares;
  private cyclicDependencyThreshhold: number;
  private middlewareEnabled: boolean;

  constructor(options: InjectorOptions = {}) {
    const {
      cyclicDependencyThreshhold = 5000,
      middlewareEnabled = true
    } = options;
    this.cyclicDependencyThreshhold = cyclicDependencyThreshhold;
    this.middlewareEnabled = middlewareEnabled;
    this.instances = {};
    this.factories = {};
    this.globalStr = '__global__';

    this.middlewares = {
      [this.globalStr]: {
        before: [],
        after: []
      }
    };

    this._applyMiddleware = this._applyMiddleware.bind(this);
    this._constructFromCachedResults = this._constructFromCachedResults.bind(this);
    this._ensureDistinct = this._ensureDistinct.bind(this);
    this._formatCachedResults = this._formatCachedResults.bind(this);
    this._getDependencyArray = this._getDependencyArray.bind(this);
    this._initMiddleware = this._initMiddleware.bind(this);
    this._isFactory = this._isFactory.bind(this);
    this._registerGlobalMiddleware = this._registerGlobalMiddleware.bind(this);
    this._runMiddleware = this._runMiddleware.bind(this);
    this.create = this.create.bind(this);
    this.factory = this.factory.bind(this);
    this.get = this.get.bind(this);
    this.graph = this.graph.bind(this);
    this.has = this.has.bind(this);
    this.middleware = this.middleware.bind(this);
    this.register = this.register.bind(this);
    this.set = this.set.bind(this);
    this.unset = this.unset.bind(this);
  }

  private _applyMiddleware(entity, lifecycle: LifeCycle): void {
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

  public create<K extends keyof T>(name: K, arg?, ...otherArgs): T[K] {
    const {
      factories,
      instances
    } = this;

    if (!Array.isArray(arg)) {
      arg = [arg];
    }

    assert(factories[name] || (instances[name] && typeof instances[name].instance === 'function'), 'Factory or Service must be registered.');

    const deps = [...arg, ...otherArgs];
    if (factories[name]) {
      const entity = factories[name];
      this.get(name); // ensure all the static dependencies are there;
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

  public graph(dependencies: IDependencies): string[] {
    const {
      _getDependencyArray,
      factories,
      has,
      instances
    } = this;

    if (isString(dependencies) && !has(dependencies)) {
      return [];
    }

    const dependenciesArray = _getDependencyArray(dependencies);

    const graph: string[] = [];
    const visited: any = {};
    const queue: string[] = [...dependenciesArray];

    while (queue.length > 0) {
      const next = queue.shift();
      const registration = factories[next] || instances[next] || { depends: [] };
      const { depends } = registration;
      const childDeps = _getDependencyArray(depends);

      childDeps.forEach((d) => {
          queue.push(d);
      });

      graph.unshift(next);
      visited[next] = true;
    }

    return graph
      .filter(uniq)
      ;
  }

  private _isFactory = (key: string): boolean => {
    const { factories } = this;
    if (factories[key]) {
      return true;
    }
    return false;
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

  /**
   * Gets a named instance if found, or constructs a factory and returns it from the container.
   * Overloads allow arrays or maps to be returned.
   * @param name - Dependency
   */
  public get<K extends keyof T>(dependencies: K): T[K];
  public get<K1 extends keyof T>(dependencies: [K1]): [T[K1]];
  public get<K1 extends keyof T, K2 extends keyof T>(dependencies: [K1, K2]): [T[K1], T[K2]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T>(dependencies: [K1, K2, K3]): [T[K1], T[K2], T[K3]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T>(dependencies: [K1, K2, K3, K4]): [T[K1], T[K2], T[K3], T[K4]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T>(dependencies: [K1, K2, K3, K4, K5]): [T[K1], T[K2], T[K3], T[K4], T[K5]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T, K20 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19, K20]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19], T[K20]];
  public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T, K20 extends keyof T, K21 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19, K20, K21]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19], T[K20], T[K21]];
  public get<K extends keyof T, U extends { [name: string]: K }>(dependencies: U): { [V in keyof U]: T[U[V]]; };
  public get<K extends keyof T>(dependencies: { [key: string]: K }) {
    if (!dependencies) {
      return null;
    }
    const {
      instances,
      factories
    } = this;

    const keys = this._getDependencyArray(dependencies);

    const queue = [...keys];

    /** 
     * Cache of instances.
     */
    const cache = instances;

    let i = 0;

    const queueMap = queue.reduce((a, b) => {
      a[b] = true;
      return a;
    }, {});

    while (queue.length > 0) {
      // console.log('='.repeat(100));
      // console.log('@get queue', queue.length, i);
      i++;

      const currentNode = queue.shift();
      delete queueMap[currentNode];

      if (i >= this.cyclicDependencyThreshhold) {
        // const index = queue.indexOf(currentNode);
        // const amtToLog = Math.min(queue.length, index);
        const amtToLog = Math.min(queue.length, 10);
        const elements = queue.slice(0, amtToLog);
        throw new Error(`Circular dependency Detected when resolving "${currentNode}"! Check Dependencies: "${elements.join('", "')}"`);
      }

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

      // its a factory


      const registeredFactory = this.factories[currentNode];
      const factoryDependencies = this._getDependencyArray(registeredFactory.depends);

      // if its not cached
      let depsNeedResolution = false;
      // queue up its unresolved dependencies
      for (const dep of factoryDependencies) {

        if (dep === currentNode) {
          throw new Error(`${currentNode} cannot have a dependency on itself! Dependency: ${dep}`);
        }
        // if dependency is a factory, it needs to be resolved first
        if (!cache[dep]) {
          if (!depsNeedResolution) {
            queueMap[currentNode] = true;
            queue.unshift(currentNode);
            depsNeedResolution = true;
          }
          // the dependency of the current node, could also be being requested
          // and as such, already in the queue which would make current node continuously requeue (circular).
          // if we were to stick it to the end of the queue, it would grow the queue to be huge - so, since it'll skip over this anyway, just queue it.
          queueMap[dep] = true;
          queue.unshift(dep);
        }
      }

      // sort out deps first, go back to queue
      if (depsNeedResolution) {
        continue;
      }

      const factoryArgs = this._formatCachedResults(registeredFactory.depends);
      const instance = this._constructFromCachedResults(registeredFactory, factoryArgs);

      cache[currentNode] = {
        ...factories[currentNode],
        instance
      };
      i--;
    }

    if (this.middlewareEnabled) {
      this._runMiddleware(keys);
    }

    // todo: not sure why this inference doesn't work in formatCached
    if (isString(dependencies)) {
      return instances[dependencies].instance;
    }

    return this._formatCachedResults(dependencies);
  }

  private _runMiddleware = (keys: string[]) => {
    const { _applyMiddleware, instances, factories } = this;
    for (const key of keys) {
      const entity = this._isFactory(key) ? factories[key] : instances[key];
      this._applyMiddleware(entity, LifeCycle.BEFORE);
      setTimeout(() => {
        _applyMiddleware(entity, LifeCycle.AFTER); // run after middleware on all instances
      }, 0);
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

  private _formatCachedResults<K extends keyof T>(dependencies: K): T[K];
  private _formatCachedResults<K1 extends keyof T>(dependencies: [K1]): [T[K1]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T>(dependencies: [K1, K2]): [T[K1], T[K2]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T>(dependencies: [K1, K2, K3]): [T[K1], T[K2], T[K3]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T>(dependencies: [K1, K2, K3, K4]): [T[K1], T[K2], T[K3], T[K4]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T>(dependencies: [K1, K2, K3, K4, K5]): [T[K1], T[K2], T[K3], T[K4], T[K5]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T, K20 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19, K20]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19], T[K20]];
  private _formatCachedResults<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T, K20 extends keyof T, K21 extends keyof T>(dependencies: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19, K20, K21]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19], T[K20], T[K21]];
  private _formatCachedResults<K extends keyof T, U extends { [name: string]: K }>(dependencies: U): { [V in keyof U]: T[U[V]]; };
  private _formatCachedResults<K extends keyof T>(dependencies: { [key: string]: K }) {
    const { instances } = this;

    if (isString(dependencies)) {
      return instances[dependencies].instance;
    }

    if (Array.isArray(dependencies)) {
      return dependencies.map((x: string) => instances[x].instance);
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

function isFunctionalFactory(factory: any): factory is IFunctionalFactory {
  const { options = {} } = factory;
  return options.function === true;
}

function isConstructorFactory(factory: any): factory is IConstructorFactory {
  const { options = {} } = factory;
  return !options.function;
}

function isString(object: any): object is string {
  return typeof object === 'string';
}

function uniq(value: string, index: number, self) {
  return self.indexOf(value) === index;
}
