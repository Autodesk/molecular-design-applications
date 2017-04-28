import { connect } from 'react-redux';
import WorkflowRouter from '../components/workflow_router';
import {
  changeLigandSelection,
  changeMorph,
  clickAbout,
  clickCancel,
  clickColorize,
  clickRun,
  clickWorkflowNodeLigandSelection,
  clickWorkflowNodeLoad,
  clickWorkflowNodeEmail,
  clickWorkflowNodeResults,
  clickWorkflowNodeInteractiveSim,
  initializeRun,
  initializeWorkflow,
  messageTimeout,
  submitEmail,
  submitInputString,
  selectInputFile,
} from '../actions';

function mapStateToProps(state, ownProps) {
  return {
    colorized: state.resultsSettings.colorized,
    morph: state.resultsSettings.morph,
    nodes: state.nodes,
    runId: ownProps.params.runId,
    selection: state.selection,
    userMessage: state.userMessage,
    workflow: state.workflow,
    workflowId: ownProps.params.workflowId,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    changeLigandSelection(inputs) {
      return (ligand) => {
        dispatch(changeLigandSelection(inputs, ligand));
      };
    },
    clickAbout() {
      dispatch(clickAbout());
    },
    clickRun(workflowId, email, inputs, inputString) {
      return () => {
        dispatch(clickRun(workflowId, email, inputs, inputString));
      };
    },
    clickWorkflowNodeLigandSelection() {
      dispatch(clickWorkflowNodeLigandSelection());
    },
    clickWorkflowNodeLoad() {
      dispatch(clickWorkflowNodeLoad());
    },
    clickWorkflowNodeEmail() {
      dispatch(clickWorkflowNodeEmail());
    },
    clickWorkflowNodeResults() {
      dispatch(clickWorkflowNodeResults());
    },
    clickWorkflowNodeInteractiveSim() {
      dispatch(clickWorkflowNodeInteractiveSim());
    },
    initializeRun(workflowId, runId) {
      dispatch(initializeRun(workflowId, runId));
    },
    initializeWorkflow(workflowId, runId) {
      dispatch(initializeWorkflow(workflowId, runId));
    },
    onClickColorize() {
      dispatch(clickColorize());
    },
    onChangeMorph(morph) {
      dispatch(changeMorph(morph));
    },
    onMessageTimeout() {
      dispatch(messageTimeout());
    },
    onSelectInputFile(workflowId) {
      return (file) => {
        dispatch(selectInputFile(file, workflowId));
      };
    },
    submitInputString(workflowId) {
      return (input) => {
        dispatch(submitInputString(input, workflowId));
      };
    },
    submitEmail(email) {
      dispatch(submitEmail(email));
    },
    clickCancel(runId) {
      return () => {
        dispatch(clickCancel(runId));
      };
    },
  };
}

function mergeProps(stateProps, dispatchProps) {
  return Object.assign({}, dispatchProps, stateProps, {
    clickRun: dispatchProps.clickRun(
      stateProps.workflow.id,
      stateProps.workflow.run.email,
      stateProps.workflow.run.inputs,
      stateProps.workflow.run.inputString,
    ),
    clickCancel: dispatchProps.clickCancel(stateProps.workflow.run.id),
    onSelectInputFile: dispatchProps.onSelectInputFile(stateProps.workflow.id),
    submitInputString: dispatchProps.submitInputString(stateProps.workflow.id),
    changeLigandSelection: dispatchProps.changeLigandSelection(
      stateProps.workflow.run.inputs,
    ),
  });
}

const WorkflowRoot = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(WorkflowRouter);

export default WorkflowRoot;
