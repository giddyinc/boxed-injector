# boxed-injector [![NPM version][npm-image]][npm-url] [![Build Status](https://travis-ci.org/giddyinc/boxed-injector.svg?branch=master)](https://travis-ci.org/giddyinc/boxed-injector) [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage Status](https://coveralls.io/repos/github/giddyinc/boxed-injector/badge.svg?branch=master)](https://coveralls.io/github/giddyinc/boxed-injector?branch=master)
> Dependency Injection Tools

## Installation

```sh
$ npm install --save boxed-injector
```

## Overview

This is a set of lightweight Dependency Injection components that can be used in both client and server javascript code.

There are 4 components.

1. Injector (Dependency Injection Container)
2. Locator (Service Locator, which leverages the DI Container)
3. [Inject](lib/Inject/README.md) (Higher Order Component for resolving dependencies declaratively into React containers) - [See separate README](lib/Inject/README.md)
4. [Injectable](lib/Injectable/README.md) (Wrapper around React Components for directly injecting resolved props) - [See separate README](lib/Injectable/README.md)


## Installation 

```sh
$ npm install --save boxed-injector
```

## Usage

```js

'use strict';

const parts = [];

class EngineFactory {
  static get inject() {
    return [
      'Parts'
    ];
  }
  constructor(parts) {
    this.parts = parts;
  }
}

class CarFactory {
  static get inject() {
    return [
      'EngineFactory'
    ];
  }
  constructor(engineFactory) {
    this.engineFactory = engineFactory;
  }
}

// Dependency Injection Container
const Injector = require('boxed-injector').Injector;
let injector = new Injector();

// Register instances
injector.register('Parts', parts);

// Register Factories
injector
  .factory('EngineFactory', EngineFactory)
  .factory('CarFactory', CarFactory);

const carFactory = injector.get('CarFactory');

console.log(carFactory);

// Service Locator - warning - this is a singleton!
const Locator = require('boxed-injector').Locator;
Locator.set(injector);
injector = Locator.get();

const sameCarFactory = injector.get('CarFactory');

console.log(sameCarFactory);
console.log(carFactory === sameCarFactory);

// injector.get('whatever');


```

## Middleware
Middleware functions are executed every time a service is accessed from the container (or on a factory, the first time it's accessed). 
Global middleware as well as service/factory specific middleware is supported and is executed in the order of registry (FIFO).
Note that registered instances are singletons and mutations will affect all consumers.
Middleware is synchronous, and is passed an object as follows:

```js
{
  name: 'ExampleService',
  depends: ['ThingItsDependentOn', 'OtherThing'],
  instance: { thing: {}, other: {} }, //fully instantiated instance,
  factory: ExampleService // factory
}
```

Usage:

```js

  // will console log before getting any instance from the container
  injector.middleware(entity => console.log('before global');
  // will console log 'baz' before getting baz from the container - will always run after global above
  injector.middleware('baz', entity => console.log(entity.name);
  // will console log for any instance, but will run after baz and above global is logged 
  injector.middleware(entity => console.log(`before global again - resolving ${entity.name}`);

  injector.register('baz', result);

  // will console log AFTER getting any instance from the container
  injector.middleware(() => console.log('after global');
  // will console log 'baz' AFTER getting baz from the container - will always run after global above
  injector.middleware('baz', entity => console.log(entity.name);

  injector.get('baz');

  // -> before global
  // -> baz
  // -> before global again
  // instance returned
  // -> baz
  // -> after global  

```

## Contributing
We look forward to seeing your contributions!

## License

MIT © [Ben Lugavere]()


[npm-image]: https://badge.fury.io/js/boxed-injector.svg
[npm-url]: https://npmjs.org/package/boxed-injector
[travis-image]: https://travis-ci.org/giddyinc/boxed-injector.svg?branch=master
[travis-url]: https://travis-ci.org/giddyinc/boxed-injector
[daviddm-image]: https://david-dm.org/giddyinc/boxed-injector.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/giddyinc/boxed-injector
[coveralls-image]: https://coveralls.io/repos/giddyinc/boxed-injector/badge.svg
[coveralls-url]: https://coveralls.io/r/giddyinc/boxed-injector
