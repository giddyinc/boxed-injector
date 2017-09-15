[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url]

# boxed-injector

> Dependency Injection Tools

## Installation

```sh
$ npm install --save boxed-injector
```

## Overview

This is a set of lightweight Dependency Injection components that can be used in both client and server javascript code.

There are 2 components. 

1. Injector (Dependency Injection Container)
2. Locator (Service Locator, which exposes the DI Container)

For client side development with React, there are additional helper utilities in [boxed-injector-react](https://github.com/giddyinc/boxed-injector-react)

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
## Create
Resolves a factory's dependencies and then instantiates an instance with the given args. Will call the constructor (new) on a registered instance that is a function.
```js
function Engine() {}
function Car(engine, color) { this.engine = engine; this.color = color; }
Car.inject = ['Engine'];
injector.factory('Engine', Engine);
injector.factory('Car', Car);
const car = injector.create('Car', ['blue']);
// { engine, engine, color: 'blue' }
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
  instance: { thing: {}, other: {} }, // fully instantiated instance,
  factory: ExampleService // factory
}
```

Usage:

```js

const Injector = require('boxed-injector');
const injector = new Injector();

// will console log before getting any instance from the container
injector.middleware(entity => console.log('before global'));
// will console log 'baz' before getting baz from the container - will always run after global above
injector.middleware('baz', entity => console.log(entity.name));
// will console log for any instance, but will run after baz and above global is logged 
injector.middleware(entity => console.log(`before global again - resolving ${entity.name}`));

injector.register('baz', 'result');

// will console log AFTER getting any instance from the container
injector.middleware(() => console.log('after global'));
// will console log 'baz' AFTER getting baz from the container - will always run after global above
injector.middleware('baz', entity => console.log(entity.name));

injector.get('baz');

// -> before global
// -> baz
// -> before global again
// instance returned
// -> baz
// -> after global  

```


## Advanced Usage
```js

// call the function directly instead of calling new on it.
injector.factory('baz', () => {}, { function: true });

// declare dependencies during registration rather than on the function.
injector.factory('baz', () => {}, { depends: ['foo'] });

// dependency could be singular.
injector.factory('baz', () => {}, { depends: 'foo' });

// dependency could be singular.
injector.factory('baz', () => {}, { depends: 'foo' });

injector.factory('d', x => x, {depends: 'c', function: true});
// etc...

// graph returns a 
injector.graph('d');
// ['d', 'c', 'b', 'a']

// true or false if the injector has a service/factory registered.
injector.has('foo');

// like injector.register, but actually replaces the instance (no guard)
injector.set('foo', 'bar');
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
