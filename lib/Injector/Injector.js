'use strict';

const assert = require('assert');

class Injector {
  constructor() {
    this.instances = {};
    this.factories = {};
    this.globalStr = '__global__';
    this.middlewares = {
      [this.globalStr]: []
    };

    this.register = this.register.bind(this);
    this.middleware = this.middleware.bind(this);
    this.factory = this.factory.bind(this);
    this.inject = this.inject.bind(this);
    this.get = this.get.bind(this);
    this._ensureDistinct = this._ensureDistinct.bind(this);
    this._applyMiddleware = this._applyMiddleware.bind(this);
    this._initMiddleware = this._initMiddleware.bind(this);
    this.create = this.create.bind(this);
  }

  _applyMiddleware(entity, lifecycle) {
    const self = this;
    const entityMiddleware = self.middlewares[entity.name];
    const globalMiddleware = self.middlewares[this.globalStr];

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
      throw new Error(`Invalid lifecycle method.`);
    }
  }

  _ensureDistinct(name) {
    assert(this.factories[name] === undefined, 'Cannot overwrite a factory once registered.');
    assert(this.instances[name] === undefined, 'Cannot overwrite a service once registered.');
  }

  _initMiddleware(name) {
    if (!this.middlewares[name]) {
      this.middlewares[name] = {
        before: [],
        after: []
      };
      this.middlewares[this.globalStr].forEach(method => this.middleware(name, method));
    }
  }

  factory(name, factory) {
    assert(name, 'Invalid name. Factories must be registered with a valid unique string.');
    this._ensureDistinct(name);
    this._initMiddleware(name);
    this.factories[name] = {
      name,
      factory,
      depends: factory.inject
    };
    return this;
  }

  register(name, instance) {
    assert(name, 'Invalid name. Instances must be registered with a valid unique string.');
    this._ensureDistinct(name);
    this._initMiddleware(name);
    this.instances[name] = {
      name,
      instance,
      depends: []
    };
    return this;
  }

  inject(Factory) {
    const args = Factory.inject || [];
    const deps = args.map(dependency => this.get(dependency));
    return new Factory(...deps);
  }

  create(name, otherArgs) {
    const self = this;
    assert(self.factories[name] || (self.instances[name] && typeof self.instances[name].instance === 'function'), 'Factory or Service must be registered.');
    if (self.factories[name]) {
      const Factory = self.factories[name].factory;
      const args = Factory.inject || [];
      const resolvedDeps = args.map(dependency => this.get(dependency));
      const merged = [].concat(resolvedDeps, otherArgs);
      return new Factory(...merged);
    }
    const Instance = self.instances[name].instance;
    return new Instance(...otherArgs);
  }

  get(name) {
    const self = this;
    let isFactory = false;
    if (self.factories[name]) {
      isFactory = true;
    }
    if (!self.instances[name]) {
      assert(self.factories[name], `${name} is not yet registered! You either misspelled the name or forgot to register it.`);
      assert(typeof self.factories[name].factory === 'function', `${name} is not a constructor. Try declaring as an instance instead of a factory.`);
      const entity = self.factories[name];
      self._applyMiddleware(entity, 'before'); // run before middleware on factory - only runs once
      self.instances[name] = Object.assign({}, self.factories[name], {
        instance: self.inject(entity.factory)
      });
    }

    const instanceEntity = self.instances[name];
    if (!isFactory) {
      self._applyMiddleware(instanceEntity, 'before'); // run before middleware on instance
    }
    setTimeout(() => {
      self._applyMiddleware(instanceEntity, 'after'); // run after middleware on all instances
    });
    return instanceEntity.instance;
  }

  middleware(name, method) {
    if (typeof name === 'function') {
      method = name;
      name = this.globalStr;
    }
    assert(typeof method === 'function', 'Middleware must be passed a function.');

    if (name === this.globalStr) {
      this.middlewares[name].push(method);
      return this;
    }

    if (!this.middlewares[name]) {
      this._initMiddleware(name);
    }

    // if service or factory isn't registered, run middleware before get
    if (!this.instances[name] && !this.factories[name]) {
      // run before all gets
      this.middlewares[name].before.push(method);
    } else {
      // run after all gets
      // if global middlewares exist, that arent in before / after already, queue them up
      const globals = this.middlewares[this.globalStr].filter(x => {
        return (!this.middlewares[name].before.includes(x) && !this.middlewares[name].after.includes(x));
      });
      this.middlewares[name].after = this.middlewares[name].after.concat(globals);
      this.middlewares[name].after.push(method);
    }

    return this;
  }

}

module.exports = Injector;
