import React from 'react';
import statusConstants from '../../../../shared/status_constants';

require('../../css/component_utils.scss');

const componentUtils = {
  getIcon(status) {
    let icon;

    if (status === statusConstants.COMPLETED) {
      icon = (
        <div className="statusImg" >
          <img src="../../img/done.svg" alt="done" />
        </div>
      );
    } else if (status === statusConstants.ERROR) {
      icon = (
        <div className="statusImg" >
          <img src="../../img/error.svg" alt="error" />
        </div>
      );
    } else if (status === statusConstants.RUNNING) {
      icon = (
        <div className="statusImg" >
          <img src="../../img/running.svg" alt="running" />
        </div>
      );
    }

    return icon;
  },
};

export default componentUtils;
