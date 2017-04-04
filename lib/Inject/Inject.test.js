
const expect = require('expect');
const Inject = require('.');
const React = require('react');
const shallow = require('enzyme').shallow;
const Injector = require('../Injector');

const injector = new Injector();
injector.register('foo', 'bar123');
const inject = new Inject(injector);

/**
 * to run standalone:
 * mocha --require babel-register lib/Inject/Inject.test.js --watch
 */

@inject({
  dep: 'foo'
})
class Foo extends React.Component {
  render() {
    return React.createElement('div', null);
  }
}

class Bar extends React.Component {
  render() {
    return React.createElement('div', null);
  }
}

describe('Inject', () => {
  let wrapper;

  it('should be a constructor', () => {
    expect(typeof Inject).toEqual('function', 'was expecting a function.');
  });

  it('should be able to inject dependencies directly into decorated components', () => {
    wrapper = shallow(React.createElement(Foo, null));
    expect(wrapper.props().dep).toEqual('bar123');
  });

  it('should be able to be used as a higher order function', () => {
    const HigherFoo = inject({dep: 'foo'})(Bar);
    wrapper = shallow(React.createElement(HigherFoo, null));
    expect(wrapper.props().dep).toEqual('bar123');
  });
});
