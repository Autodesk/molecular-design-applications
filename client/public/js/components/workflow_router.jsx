import React from 'react';
import { Map as IMap } from 'immutable';
import Canceled from './canceled';
import Errored from './errored';
import Snackbar from './snackbar';
import ThankYou from './thank_you';
import SelectionRecord from '../records/selection_record';
import UserMessageRecord from '../records/user_message_record';
import WorkflowRecord from '../records/workflow_record';
import Workflow from './workflow';
import statusConstants from '../../../../shared/status_constants';

class WorkflowRouter extends React.Component {
  componentDidMount() {
    this.initialize(
      this.props.workflowId, this.props.runId, this.props.workflow.title
    );

    this.state = {
      snackbarClosed: true,
    };

    this.onRequestCloseSnackbar = this.onRequestCloseSnackbar.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const changingWorkflowId = nextProps.workflowId &&
      this.props.workflowId !== nextProps.workflowId;
    const changingRunId = nextProps.runId &&
      nextProps.runId !== this.props.runId;
    const missingWorkflow = nextProps.workflowId &&
      nextProps.workflow.id !== nextProps.workflowId;
    const missingRun = nextProps.runId &&
      nextProps.workflow.runId !== nextProps.runId;
    const fetching = nextProps.workflow.fetching;
    const needWorkflow = changingWorkflowId && missingWorkflow;
    const needRun = changingRunId && missingRun;

    // Reinitialize when need workflow/run (like on back button)
    if (!fetching && (needWorkflow || needRun)) {
      this.initialize(
        nextProps.workflowId, nextProps.runId, nextProps.workflow.title
      );
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
  initialize(workflowId, runId, workflowTitle) {
    this.props.initializeWorkflow(workflowId, runId);

    if (runId) {
      document.title = `Workflow - Run of "${workflowTitle}"`;
    } else {
      document.title = `Workflow - "${workflowTitle}"`;
    }
  }

  render() {
    let routeEl;

    if (this.props.workflowStatus === statusConstants.RUNNING) {
      routeEl = (
        <ThankYou
          canceling={this.props.workflow.canceling}
          email={this.props.workflow.email}
          onClickCancel={this.props.clickCancel}
        />
      );
    } else if (this.props.workflowStatus === statusConstants.CANCELED) {
      routeEl = (
        <Canceled />
      );
    } else if (this.props.workflowStatus === statusConstants.ERROR) {
      routeEl = (
        <Errored />
      );
    } else {
      routeEl = (
        <Workflow
          clickAbout={this.props.clickAbout}
          clickRun={this.props.clickRun}
          clickWorkflowNodeLoad={this.props.clickWorkflowNodeLoad}
          clickWorkflowNodeEmail={this.props.clickWorkflowNodeEmail}
          clickWorkflowNodeResults={this.props.clickWorkflowNodeResults}
          colorized={this.props.colorized}
          fetchingPdb={this.props.fetchingPdb}
          fetchingPdbError={this.props.fetchingPdbError}
          morph={this.props.morph}
          nodes={this.props.nodes}
          onClickColorize={this.props.onClickColorize}
          onChangeMorph={this.props.onChangeMorph}
          onUpload={this.props.onUpload}
          selection={this.props.selection}
          submitPdbId={this.props.submitPdbId}
          submitEmail={this.props.submitEmail}
          workflow={this.props.workflow}
          workflowStatus={this.props.workflowStatus}
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
  clickAbout: React.PropTypes.func.isRequired,
  clickCancel: React.PropTypes.func.isRequired,
  clickRun: React.PropTypes.func.isRequired,
  clickWorkflowNodeLoad: React.PropTypes.func.isRequired,
  clickWorkflowNodeEmail: React.PropTypes.func.isRequired,
  clickWorkflowNodeResults: React.PropTypes.func.isRequired,
  colorized: React.PropTypes.bool.isRequired,
  fetchingPdb: React.PropTypes.bool,
  fetchingPdbError: React.PropTypes.string,
  initializeWorkflow: React.PropTypes.func.isRequired,
  morph: React.PropTypes.number.isRequired,
  nodes: React.PropTypes.instanceOf(IMap),
  onClickColorize: React.PropTypes.func.isRequired,
  onChangeMorph: React.PropTypes.func.isRequired,
  onMessageTimeout: React.PropTypes.func.isRequired,
  onUpload: React.PropTypes.func.isRequired,
  runId: React.PropTypes.string,
  selection: React.PropTypes.instanceOf(SelectionRecord).isRequired,
  submitPdbId: React.PropTypes.func.isRequired,
  submitEmail: React.PropTypes.func.isRequired,
  userMessage: React.PropTypes.instanceOf(UserMessageRecord).isRequired,
  workflow: React.PropTypes.instanceOf(WorkflowRecord),
  workflowId: React.PropTypes.string.isRequired,
  workflowStatus: React.PropTypes.string.isRequired,
};

export default WorkflowRouter;
