
'use strict';

const React = require('react');

const Inject = function (injector) {
  this.injector = injector;
  return dependencies => {
    return target => {
      const props = {};
      for (const i in dependencies) {
        props[i] = this.injector.get(dependencies[i]);
      }
      return React.createClass({
        render: function () {
          return React.createElement(target, Object.assign({}, this.props, props));
        }
      });
    };
  };
};

module.exports = Inject;
