
# Boxed Injector

## Injectable

### Overiew
Dependency Injection Wrapper around React Components which will allow you to pass references directly into props. This is useful with react-router.

### Usage

```js

// using react router...

const Injectable = require('boxed-injector').Injectable;

class MyComponent extends Component {
  constructor(props) {
    console.log(props.factory);
  }
}

// in a react route
const InjectedComponent = 
const myRoute = {
  path: 'foo',
  getComponent(location, cb) {
    cb(null, Injectable(require('./MyComponent'), {
      location,
      factory: injector.get('CarFactory')
    }));
  }
};

// or

const InjectedComponent = Injectable(
  require('./MyComponent'), {
    factory: injector.get('CarFactory')
  });

// JSX
<InjectedComponent/>

```
