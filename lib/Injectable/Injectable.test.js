
'use strict';

const React = require('react');
const expect = require('expect');
const injectable = require('./Injectable');
const shallow = require('enzyme').shallow;

class Foo extends React.Component {
  render() {
    return <div/>;
  }
}

describe('Injectable', () => {
  let InjectedComponent;
  let wrapper;

  beforeEach(() => {
    InjectedComponent = injectable(Foo, {
      name: 'foo',
      title: {type: 'bar'}
    });
    wrapper = shallow(<InjectedComponent/>);
  });

  it('should inject dependencies directly into components props', () => {
    expect(wrapper.props().name).toEqual('foo');
    expect(wrapper.props().title).toEqual({type: 'bar'});
  });
});
