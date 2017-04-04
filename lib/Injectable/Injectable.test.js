
'use strict';

const React = require('react');
const expect = require('expect');
const injectable = require('.');
const shallow = require('enzyme').shallow;

/**
 * to run standalone:
 * mocha --require babel-register lib/Injectable/Injectable.test.js --watch
 */

describe('Injectable', () => {
  let InjectedComponent;
  let wrapper;

  beforeEach(() => {
    class Foo extends React.Component {
      render() {
        return React.createElement('div', null);
      }
    }
    InjectedComponent = injectable(Foo, {
      name: 'foo',
      title: {type: 'bar'}
    });
    wrapper = shallow(React.createElement(InjectedComponent, null));
  });

  it('should inject dependencies directly into components props', () => {
    expect(wrapper.props().name).toEqual('foo');
    expect(wrapper.props().title).toEqual({type: 'bar'});
  });
});
