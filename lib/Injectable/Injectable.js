
'use strict';

import React from 'react';

const Injectable = function (Component, props) {
  return React.createClass({
    render: function () {
      return React.createElement(Component, Object.assign({}, this.props, props));
    }
  });
};

module.exports = Injectable;
