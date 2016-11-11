
const expect = require('expect');
const Inject = require('./Inject');
const React = require('react');
import {shallow} from 'enzyme';
import Injector from '../Injector/Injector';

const injector = new Injector();
injector.register('foo', 'bar123');
const inject = new Inject(injector);

/**
 * to run standalone:
 * mocha --require ./test/testSetup.js src/infrastructure/Inject.test.js --watch
 */

@inject({
  dep: 'foo'
})
class Foo extends React.Component {
  render() {
    return <div/>;
  }
}

class Bar extends React.Component {
  render() {
    return <div/>;
  }
}

describe('Inject', () => {
  let wrapper;

  it('should be a constructor', () => {
    expect(typeof Inject).toEqual('function', 'was expecting a function.');
  });

  it('should be able to inject dependencies directly into decorated components', () => {
    wrapper = shallow(<Foo />);
    expect(wrapper.props().dep).toEqual('bar123');
  });

  it('should be able to be used as a higher order function', () => {
    const HigherFoo = inject({dep: 'foo'})(Bar);
    wrapper = shallow(<HigherFoo />);
    expect(wrapper.props().dep).toEqual('bar123');
  });
});
