'use strict';

const assert = require('assert');
const autoBind = require('auto-bind');

class Injector {
  constructor() {
    this.instances = {};
    this.factories = {};
    this.globalStr = '__global__';

    this.middlewares = {
      [this.globalStr]: []
    };

    autoBind(this);
  }

  _applyMiddleware(entity, lifecycle) {
    const {
      globalStr,
      middlewares
    } = this;

    const entityMiddleware = middlewares[entity.name];
    const globalMiddleware = middlewares[globalStr];

    const run = middlewares => {
      middlewares.forEach(middleware => middleware(entity));
    };

    if (lifecycle === 'before') {
      if (entityMiddleware) {
        run(entityMiddleware.before);
      }
    } else if (lifecycle === 'after') {
      const globalAfter = globalMiddleware
        .filter(x => {
          return (!entityMiddleware.before.includes(x) && !entityMiddleware.after.includes(x));
        });
      run(entityMiddleware.after.concat(globalAfter));
    } else {
      throw new Error('Invalid lifecycle method.');
    }
  }

  _ensureDistinct(name) {
    const {
      instances,
      factories
    } = this;
    assert(factories[name] === undefined, 'Cannot overwrite a factory once registered.');
    assert(instances[name] === undefined, 'Cannot overwrite a service once registered.');
  }

  _initMiddleware(name) {
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

  set(key, value) {
    if (!this.has(key)) {
      return this.register(key, value);
    }
    Object.assign(this.instances[key], {
      instance: value
    });
    return this;
  }

  has(key) {
    return Boolean(this.factories[key] || this.instances[key]);
  }

  factory(name, factory, options) {
    const {
      _ensureDistinct,
      _initMiddleware,
      factories
    } = this;

    assert(name, 'Invalid name. Factories must be registered with a valid unique string.');

    _ensureDistinct(name);
    _initMiddleware(name);

    options = options || {};

    let depends = options.depends || factory.inject;

    if (!depends) {
      depends = [];
    }

    if (!Array.isArray(depends)) {
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

  register(name, instance, options) {
    const {
      _ensureDistinct,
      _initMiddleware,
      instances
    } = this;
    assert(name, 'Invalid name. Instances must be registered with a valid unique string.');

    _ensureDistinct(name);
    _initMiddleware(name);

    options = options || {};

    let depends = options.depends || [];

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
    const factory = entity.factory;
    const args = entity.depends || [];
    const deps = args.map(dependency => get(dependency));

    if (entity.options.function) {
      return factory(...deps);
    }

    return new factory(...deps); /* eslint new-cap:0 */
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

  graph(name, nested) {
    const {
      factories,
      has,
      instances
    } = this;

    const defaultObj = {all: [], hash: {}};
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
      console.log('this bout to fail', child);
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
      _applyMiddleware(entity, 'before'); // run before middleware on factory - only runs once
      instances[name] = Object.assign({}, factories[name], {
        instance: inject(entity)
      });
    }

    const instanceEntity = instances[name];
    if (!isFactory) {
      _applyMiddleware(instanceEntity, 'before'); // run before middleware on instance
    }

    setTimeout(() => {
      _applyMiddleware(instanceEntity, 'after'); // run after middleware on all instances
    });

    return instanceEntity.instance;
  }

  middleware(name, method) {
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

module.exports = Injector;