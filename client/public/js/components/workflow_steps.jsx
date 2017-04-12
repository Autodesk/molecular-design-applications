import React from 'react';
import { statusConstants } from 'molecular-design-applications-shared';
import Button from './button';
import SelectionRecord from '../records/selection_record';
import WorkflowRecord from '../records/workflow_record';
import WorkflowStep from './workflow_step';
import ioUtils from '../utils/io_utils';
import selectionConstants from '../constants/selection_constants';

require('../../css/workflow_steps.scss');

function WorkflowSteps(props) {
  const runCompleted = props.workflow.run.status === statusConstants.COMPLETED;
  const aboutSelected = props.selection.type === selectionConstants.ABOUT;
  const loadSelected = props.selection.type ===
    selectionConstants.WORKFLOW_NODE_LOAD;
  const loadCompleted = !props.workflow.run.inputFileError &&
    !props.workflow.run.inputStringError &&
    ioUtils.getPdb(props.workflow.run.inputs);
  const loadStatus = loadCompleted ?
    statusConstants.COMPLETED : statusConstants.IDLE;
  const runSelected = props.selection.type ===
    selectionConstants.WORKFLOW_NODE_RUN;
  const runStatus = runCompleted ? statusConstants.COMPLETED : statusConstants.IDLE;
  let runLast = true;

  const ligandStatus = ioUtils.getSelectedLigand(props.workflow.run.inputs) ?
    statusConstants.COMPLETED : statusConstants.IDLE;
  const ligandCompleted = loadCompleted && (!props.workflow.selectLigands ||
    ligandStatus === statusConstants.COMPLETED);


  let resultsNode;
  if (runCompleted) {
    runLast = false;
    const resultsSelected = props.selection.type ===
      selectionConstants.WORKFLOW_NODE_RESULTS;
    resultsNode = (
      <WorkflowStep
        primaryText={'Results'}
        number={3}
        onClick={props.clickWorkflowNodeResults}
        selected={resultsSelected}
        status={statusConstants.COMPLETED}
        last
      />
    );
  }

  let selectLigandsNode;
  if (props.workflow.selectLigands) {
    const ligandSelectionSelected = props.selection.type ===
      selectionConstants.WORKFLOW_NODE_LIGAND_SELECTION;
    selectLigandsNode = (
      <WorkflowStep
        disabled={!loadCompleted}
        primaryText={'Ligand Selection'}
        number={2}
        onClick={props.clickWorkflowNodeLigandSelection}
        selected={ligandSelectionSelected}
        status={ligandStatus}
      />
    );
  }

  let runNode;
  let interactiveSimNode;
  if (props.workflow.id === '4') {
    const selected = props.selection.type === selectionConstants.WORKFLOW_NODE_INTERACTIVE_SIM;
    const status = statusConstants.IDLE;
    interactiveSimNode = (
      <WorkflowStep
        disabled={!loadCompleted}
        primaryText={'Interactive Simulation'}
        number={2}
        onClick={props.clickWorkflowNodeInteractiveSim}
        selected={selected}
        status={status}
        last
      />
    );
  } else {
    runNode = (
      <WorkflowStep
        disabled={!ligandCompleted}
        primaryText={'Run'}
        number={selectLigandsNode ? 3 : 2}
        onClick={props.clickWorkflowNodeEmail}
        selected={runSelected}
        status={runStatus}
        last={runLast}
      />
    );
  }

  let stepsEl;
  if (!props.hideSteps) {
    stepsEl = [
      <div key={0} className="workflow-steps">
        <ol>
          <WorkflowStep
            primaryText={'Load molecule'}
            number={1}
            selected={loadSelected}
            status={loadStatus}
            onClick={props.clickWorkflowNodeLoad}
          />
          {selectLigandsNode}
          {interactiveSimNode}
          {runNode}
          {resultsNode}
        </ol>
      </div>,

      <div key={1} className="actions">
        <Button
          onClick={props.clickAbout}
          active={aboutSelected}
        >
          About
        </Button>
      </div>,
    ];
  }

  return (
    <div className="workflow-steps-pane">
      {stepsEl}
    </div>
  );
}

WorkflowSteps.defaultProps = {
  hideSteps: false,
};

WorkflowSteps.propTypes = {
  clickAbout: React.PropTypes.func.isRequired,
  clickWorkflowNodeLigandSelection: React.PropTypes.func.isRequired,
  clickWorkflowNodeLoad: React.PropTypes.func.isRequired,
  clickWorkflowNodeEmail: React.PropTypes.func.isRequired,
  clickWorkflowNodeResults: React.PropTypes.func.isRequired,
  clickWorkflowNodeInteractiveSim: React.PropTypes.func.isRequired,
  hideSteps: React.PropTypes.bool,
  workflow: React.PropTypes.instanceOf(WorkflowRecord).isRequired,
  selection: React.PropTypes.instanceOf(SelectionRecord).isRequired,
};

export default WorkflowSteps;
