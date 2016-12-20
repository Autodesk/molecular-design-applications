import React from 'react';
import Button from './button';
import SelectionRecord from '../records/selection_record';
import WorkflowRecord from '../records/workflow_record';
import WorkflowStep from './workflow_step';
import selectionConstants from '../constants/selection_constants';
import statusConstants from '../../../../shared/status_constants';
import workflowUtils from '../utils/workflow_utils';

require('../../css/workflow_steps.scss');

function WorkflowSteps(props) {
  const running = props.workflowStatus === statusConstants.RUNNING;
  const runDisabled = running ||
    !workflowUtils.isRunnable(props.workflow);

  const loadSelected = props.selection.type ===
    selectionConstants.WORKFLOW_NODE_LOAD;
  const loadStatus = props.workflow.pdbUrl ?
    statusConstants.COMPLETED : statusConstants.IDLE;
  const emailSelected = props.selection.type ===
    selectionConstants.WORKFLOW_NODE_EMAIL;
  const emailStatus = props.workflow.email ?
    statusConstants.COMPLETED : statusConstants.IDLE;
  let emailLast = true;

  let resultsNode;
  if (props.workflowStatus === statusConstants.COMPLETED) {
    emailLast = false;
    const resultsSelected = props.selection.type ===
      selectionConstants.WORKFLOW_NODE_RESULTS;
    resultsNode = (
      <WorkflowStep
        primaryText={'Results'}
        onClick={props.clickWorkflowNodeResults}
        selected={resultsSelected}
        status={statusConstants.COMPLETED}
        last
      />
    );
  }

  let workflowStepsEl;
  if (props.workflow.workflowNodes.size) {
    workflowStepsEl = [
      <div key={0} className="workflow-steps">
        <ol>
          <WorkflowStep
            primaryText={'Load molecule'}
            selected={loadSelected}
            status={loadStatus}
            onClick={props.clickWorkflowNodeLoad}
          />
          <WorkflowStep
            primaryText={'Enter email'}
            onClick={props.clickWorkflowNodeEmail}
            selected={emailSelected}
            status={emailStatus}
            last={emailLast}
          />
          {resultsNode}
        </ol>
      </div>,
      <div key={1} className="actions">
        <Button
          onClick={props.clickAbout}
        >
          About
        </Button>
        <Button
          type="raised"
          onClick={props.clickRun}
          disabled={runDisabled}
        >
          Run
        </Button>
      </div>,
    ];
  }

  return (
    <div className="workflow-steps-pane">
      {workflowStepsEl}
    </div>
  );
}

WorkflowSteps.propTypes = {
  clickAbout: React.PropTypes.func.isRequired,
  clickRun: React.PropTypes.func.isRequired,
  clickWorkflowNodeLoad: React.PropTypes.func.isRequired,
  clickWorkflowNodeEmail: React.PropTypes.func.isRequired,
  clickWorkflowNodeResults: React.PropTypes.func.isRequired,
  workflow: React.PropTypes.instanceOf(WorkflowRecord),
  workflowStatus: React.PropTypes.string.isRequired,
  selection: React.PropTypes.instanceOf(SelectionRecord).isRequired,
};

export default WorkflowSteps;
