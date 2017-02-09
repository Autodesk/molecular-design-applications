import React from 'react';
import { Map as IMap } from 'immutable';
import { statusConstants } from 'molecular-design-applications-shared';
import Canceled from './canceled';
import Errored from './errored';
import Snackbar from './snackbar';
import ThankYou from './thank_you';
import SelectionRecord from '../records/selection_record';
import UserMessageRecord from '../records/user_message_record';
import WorkflowRecord from '../records/workflow_record';
import Workflow from './workflow';

class WorkflowRouter extends React.Component {
  componentDidMount() {
    this.initialize(this.props.workflowId, this.props.runId);

    this.state = {
      snackbarClosed: true,
    };

    this.onRequestCloseSnackbar = this.onRequestCloseSnackbar.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const fetching = nextProps.workflow.fetching;
    const changingWorkflowId = nextProps.workflowId &&
      this.props.workflowId !== nextProps.workflowId;
    const changingRunId = nextProps.runId !== this.props.runId;

    if (!fetching && (changingWorkflowId || changingRunId)) {
      this.initialize(nextProps.workflowId, nextProps.runId);
    }

    if (!this.props.workflow.fetchingError &&
      nextProps.workflow.fetchingError) {
      this.setState({
        snackbarClosed: false,
      });
    }
  }

  onRequestCloseSnackbar() {
    this.setState({
      snackbarClosed: true,
    });
  }

  // Set up page for workflow/run distinction
  initialize(workflowId, runId) {
    if (runId) {
      return this.props.initializeRun(workflowId, runId);
    }

    return this.props.initializeWorkflow(workflowId);
  }

  render() {
    if (this.props.runId) {
      document.title = `Workflow - Run of "${this.props.workflow.title}"`;
    } else {
      document.title = `Workflow - "${this.props.workflow.title}"`;
    }

    let routeEl;
    if (this.props.workflow.run.status === statusConstants.RUNNING) {
      routeEl = (
        <ThankYou
          canceling={this.props.workflow.run.canceling}
          email={this.props.workflow.run.email}
          onClickCancel={this.props.clickCancel}
        />
      );
    } else if (this.props.workflow.run.status === statusConstants.CANCELED) {
      routeEl = (
        <Canceled />
      );
    } else if (this.props.workflow.run.status === statusConstants.ERROR) {
      routeEl = (
        <Errored />
      );
    } else {
      routeEl = (
        <Workflow
          changeLigandSelection={this.props.changeLigandSelection}
          clickAbout={this.props.clickAbout}
          clickRun={this.props.clickRun}
          clickWorkflowNodeLigandSelection={this.props.clickWorkflowNodeLigandSelection}
          clickWorkflowNodeLoad={this.props.clickWorkflowNodeLoad}
          clickWorkflowNodeEmail={this.props.clickWorkflowNodeEmail}
          clickWorkflowNodeResults={this.props.clickWorkflowNodeResults}
          colorized={this.props.colorized}
          morph={this.props.morph}
          nodes={this.props.nodes}
          onClickColorize={this.props.onClickColorize}
          onChangeMorph={this.props.onChangeMorph}
          onSelectInputFile={this.props.onSelectInputFile}
          selection={this.props.selection}
          submitPdbId={this.props.submitPdbId}
          submitEmail={this.props.submitEmail}
          workflow={this.props.workflow}
          runPage={!!this.props.runId}
        />
      );
    }

    return (
      <div className="workflow-router" style={{ flex: 1 }}>
        {routeEl}
        <Snackbar
          onMessageTimeout={this.props.onMessageTimeout}
          userMessage={this.props.userMessage}
        />
      </div>
    );
  }
}

WorkflowRouter.propTypes = {
  canceling: React.PropTypes.bool,
  changeLigandSelection: React.PropTypes.func,
  clickAbout: React.PropTypes.func.isRequired,
  clickCancel: React.PropTypes.func.isRequired,
  clickRun: React.PropTypes.func.isRequired,
  clickWorkflowNodeLigandSelection: React.PropTypes.func.isRequired,
  clickWorkflowNodeLoad: React.PropTypes.func.isRequired,
  clickWorkflowNodeEmail: React.PropTypes.func.isRequired,
  clickWorkflowNodeResults: React.PropTypes.func.isRequired,
  colorized: React.PropTypes.bool.isRequired,
  initializeRun: React.PropTypes.func.isRequired,
  initializeWorkflow: React.PropTypes.func.isRequired,
  morph: React.PropTypes.number.isRequired,
  nodes: React.PropTypes.instanceOf(IMap),
  onClickColorize: React.PropTypes.func.isRequired,
  onChangeMorph: React.PropTypes.func.isRequired,
  onMessageTimeout: React.PropTypes.func.isRequired,
  onSelectInputFile: React.PropTypes.func.isRequired,
  runId: React.PropTypes.string,
  selection: React.PropTypes.instanceOf(SelectionRecord).isRequired,
  submitPdbId: React.PropTypes.func.isRequired,
  submitEmail: React.PropTypes.func.isRequired,
  userMessage: React.PropTypes.instanceOf(UserMessageRecord).isRequired,
  workflow: React.PropTypes.instanceOf(WorkflowRecord),
  workflowId: React.PropTypes.string.isRequired,
};

export default WorkflowRouter;
