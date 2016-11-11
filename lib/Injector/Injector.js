
'use strict';

class Injector {
  constructor() {
    this.dependencies = {};
    this.factories = {};

    this.register = this.register.bind(this);
    this.factory = this.factory.bind(this);
    this.inject = this.inject.bind(this);
    this.get = this.get.bind(this);
  }

  factory(name, factory) {
    this.factories[name] = factory;
    return this;
  }

  register(name, instance) {
    this.dependencies[name] = instance;
    return this;
  }

  inject(Factory) {
    const args = Factory.inject || [];
    const deps = args.map(dependency => this.get(dependency));
    return new Factory(...deps);
  }

  get(name) {
    if (!this.dependencies[name]) {
      const factory = this.factories[name];
      this.dependencies[name] = factory && this.inject(factory);
      if (!this.dependencies[name]) {
        throw new Error('Module not found: ' + name);
      }
    }
    return this.dependencies[name];
  }

}

export default Injector;
