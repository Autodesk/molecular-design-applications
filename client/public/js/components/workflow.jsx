import { Map as IMap } from 'immutable';
import React from 'react';
import SelectionRecord from '../records/selection_record';
import Status from '../components/status';
import View from '../components/view';
import WorkflowRecord from '../records/workflow_record';
import WorkflowSteps from '../components/workflow_steps';
import ioUtils from '../utils/io_utils';
import selectionConstants from '../constants/selection_constants';

require('../../css/workflow.scss');

function Workflow(props) {
  const outputPdbs = ioUtils.getAnimationPdbs(props.workflow.run.outputs);

  let selectedModelData;
  // TODO this will never happen b/c not displaying nodes anymore
  if (props.selection.type === selectionConstants.WORKFLOW_NODE) {
    const selectedWorkflowNode = props.workflow.workflowNodes.find(
      workflowNode => workflowNode.id === props.selection.id,
    );
    selectedModelData = selectedWorkflowNode.modelData;
  } else if ((props.selection.type === selectionConstants.WORKFLOW_NODE_LOAD ||
    props.selection.type === selectionConstants.WORKFLOW_NODE_RUN ||
    props.selection.type === selectionConstants.WORKFLOW_NODE_LIGAND_SELECTION) &&
    props.workflow.run.inputs.size) {
    selectedModelData = ioUtils.getPdb(props.workflow.run.inputs);
  } else if (props.selection.type ===
    selectionConstants.WORKFLOW_NODE_RESULTS) {
    // Morph is chosen from a list of all input/output pdbs
    selectedModelData = outputPdbs.get(props.morph);
  }

  let viewError;
  const fetchingError = props.workflow.fetchingError;
  if (fetchingError && fetchingError.response &&
    fetchingError.response.status === 404) {
    const lookingFor = props.runPage ? 'run' : 'workflow';
    viewError = `This ${lookingFor} does not exist!`;
  }

  let selectionStrings = null;
  const selectedLigand = ioUtils.getSelectedLigand(props.workflow.run.inputs);
  if (selectedLigand) {
    selectionStrings = ioUtils.getLigandSelectionStrings(
      props.workflow.run.inputs, selectedLigand,
    );
  }

  const loadingOrError = !!(props.workflow.fetching ||
    props.workflow.fetchingError ||
    props.workflow.run.fetchingDataError);
  const hideStatus = props.workflow.fetching ||
    props.workflow.run.fetchingDataError;

  return (
    <div className="workflow">
      <WorkflowSteps
        clickAbout={props.clickAbout}
        clickWorkflowNodeLoad={props.clickWorkflowNodeLoad}
        clickWorkflowNodeLigandSelection={props.clickWorkflowNodeLigandSelection}
        clickWorkflowNodeEmail={props.clickWorkflowNodeEmail}
        clickWorkflowNodeInteractiveSim={props.clickWorkflowNodeInteractiveSim}
        clickWorkflowNodeResults={props.clickWorkflowNodeResults}
        selection={props.selection}
        workflow={props.workflow}
        hideSteps={loadingOrError}
      />
      <Status
        changeLigandSelection={props.changeLigandSelection}
        clickRun={props.clickRun}
        fetching={props.workflow.fetching}
        fetchingData={props.workflow.run.fetchingData}
        hideContent={hideStatus}
        morph={props.morph}
        nodes={props.nodes}
        numberOfPdbs={outputPdbs.size}
        onClickColorize={props.onClickColorize}
        onChangeMorph={props.onChangeMorph}
        onSelectInputFile={props.onSelectInputFile}
        selectedLigand={selectedLigand}
        selection={props.selection}
        submitInputString={props.submitInputString}
        submitEmail={props.submitEmail}
        workflow={props.workflow}
      />
      <View
        colorized={props.colorized}
        error={viewError}
        loading={props.workflow.fetching || props.workflow.run.fetchingData}
        modelData={selectedModelData}
        selectionStrings={selectionStrings}
        workflow={props.workflow}
      />
    </div>
  );
}

Workflow.defaultProps = {
  workflow: null,
};

Workflow.propTypes = {
  changeLigandSelection: React.PropTypes.func.isRequired,
  clickAbout: React.PropTypes.func.isRequired,
  clickRun: React.PropTypes.func.isRequired,
  clickWorkflowNodeLigandSelection: React.PropTypes.func.isRequired,
  clickWorkflowNodeLoad: React.PropTypes.func.isRequired,
  clickWorkflowNodeEmail: React.PropTypes.func.isRequired,
  clickWorkflowNodeResults: React.PropTypes.func.isRequired,
  clickWorkflowNodeInteractiveSim: React.PropTypes.func.isRequired,
  colorized: React.PropTypes.bool.isRequired,
  morph: React.PropTypes.number.isRequired,
  nodes: React.PropTypes.instanceOf(IMap).isRequired,
  onClickColorize: React.PropTypes.func.isRequired,
  onChangeMorph: React.PropTypes.func.isRequired,
  onSelectInputFile: React.PropTypes.func.isRequired,
  runPage: React.PropTypes.bool.isRequired,
  selection: React.PropTypes.instanceOf(SelectionRecord).isRequired,
  submitInputString: React.PropTypes.func.isRequired,
  submitEmail: React.PropTypes.func.isRequired,
  workflow: React.PropTypes.instanceOf(WorkflowRecord),
};

export default Workflow;
