
# Boxed Injector

## @Inject

### Overiew
Dependency Injection Higher Order Component for React Containers. 
This will allow you to delcaratively define a react component's dependencies, and
have a the dependecy injection container resolve / inject them into the component props on render.

### Usage
```js
@inject({ 'alias': 'RegisteredName' })
class MyComponent {
}
```

### Full Example
```js

import React, {Component, PropTypes} from 'react';
const Inject = require('boxed-injector').Inject;
/** 
* see locator docs for using a service locator. alternative is to expose a 
* commonjs module exposing inject from the application bootstrapping.
*/
const injector = Locator.get();
const inject = new Inject(injector);

@inject({
  factory: 'CarFactory'
})
class MyComponent extends Component {
  constructor(props) {
    console.log(props.factory);
  }
}

// or if you use redux...
@inject({
  factory: 'CarFactory'
})
@connect(
  (state, ownProps) => ({
    factory: ownProps.CarFactory
  }))
class MyComponent extends Component {
  constructor(props) {
    console.log(props.factory);
  }
}
```
