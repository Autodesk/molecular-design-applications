import React from 'react';

function WidgetCCCTurbo(props) {
  return (
    <div className="app-container">
      {props.children}
    </div>
  );
}

WidgetCCCTurbo.propTypes = {
  children: React.PropTypes.element,
};

export default WidgetCCCTurbo;
