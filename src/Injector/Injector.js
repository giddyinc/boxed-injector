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
      throw new Error('Invalid lifecycle method.');
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

  set(key, value) {
    if (!this.has(key)) {
      return this.register(key, value);
    }
    Object.assign(this.instances[key], {
      instance: value
    });
  }

  has(key) {
    return Boolean(this.factories[key] || this.instances[key]);
  }

  factory(name, factory, options) {
    assert(name, 'Invalid name. Factories must be registered with a valid unique string.');
    this._ensureDistinct(name);
    this._initMiddleware(name);
    options = options || {};

    let depends = options.depends || factory.inject;

    if (!depends) {
      depends = [];
    }

    if (!Array.isArray(depends)) {
      depends = [depends];
    }

    this.factories[name] = {
      name,
      factory,
      depends,
      options
    };

    return this;
  }

  register(name, instance, options) {
    assert(name, 'Invalid name. Instances must be registered with a valid unique string.');
    this._ensureDistinct(name);
    this._initMiddleware(name);
    options = options || {};

    let depends = options.depends || [];

    if (!Array.isArray(depends)) {
      depends = [depends];
    }

    this.instances[name] = {
      name,
      instance,
      depends
    };

    return this;
  }

  inject(entity) {
    const factory = entity.factory;
    const args = entity.depends || [];
    const deps = args.map(dependency => this.get(dependency));

    if (entity.options.function) {
      return factory(...deps);
    }

    return new factory(...deps); /* eslint new-cap:0 */
  }

  create(name, otherArgs) {
    const self = this;

    if (arguments.length > 2) {
      otherArgs = [...arguments].slice(1);
    }

    assert(self.factories[name] || (self.instances[name] && typeof self.instances[name].instance === 'function'), 'Factory or Service must be registered.');
    if (self.factories[name]) {
      const entity = self.factories[name];
      const Factory = entity.factory;
      const args = entity.depends || [];
      const resolvedDeps = args.map(dependency => this.get(dependency));
      const merged = [].concat(resolvedDeps, otherArgs);
      return new Factory(...merged);
    }
    const Instance = self.instances[name].instance;
    return new Instance(...otherArgs);
  }

  graph(name, nested) {
    if (!Array.isArray(name) && !this.factories[name] && !this.instances[name]) {
      return [];
    }

    const entityKeys = Array.isArray(name) ? name : [name];
    const deps = entityKeys.reduce((children, key) => {
      const entity = this.factories[key] ? this.factories[key] : this.instances[key];
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
    }, {
      all: [],
      hash: {}
    });

    if (!nested) {
      return graph.all;
    }

    return graph;
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
        instance: self.inject(entity)
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
