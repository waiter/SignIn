import React from 'react';

export default class BindComponent extends React.Component {
  constructor(props, funcArr) {
    super(props);
    (funcArr || []).forEach(str => {this[str] = this[str].bind(this);});
  }
  render() {
    return null;
  }
}
