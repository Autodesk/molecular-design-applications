import React from 'react';
import CircularProgress from 'material-ui/CircularProgress';
// import MDTSelector from 'mdt-selector';
import Molecule3d from 'molecule-3d-for-react';
import WorkflowNodeRecord from '../records/workflow_node_record';
import viewEmptyImage from '../../img/view_empty.png';
import pdbToJson from '../utils/pdb_to_json';

require('../../css/view.scss');

function View(props) {
  let view;

  if (props.workflowNode && props.workflowNode.fetchingPDB) {
    view = (
      <div className="placeholder">
        <CircularProgress />
      </div>
    );
  } else if (props.workflowNode && props.workflowNode.modelData) {
    /*
    view = (
      <MDTSelector
        modelData={props.workflowNode.modelData.toJS()}
      />
    );
    */
    const modelData = pdbToJson.convert(props.workflowNode.modelData);
    view = (
      <Molecule3d modelData={modelData} />
    );
  } else {
    view = (
      <div className="placeholder">
        <img src={viewEmptyImage} alt="View Placeholder" />
        You need to run a workflow first.
      </div>
    );
  }

  return (
    <div className="view">
      {view}
    </div>
  );
}

View.propTypes = {
  workflowNode: React.PropTypes.instanceOf(WorkflowNodeRecord),
};

export default View;
