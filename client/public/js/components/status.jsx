import React from 'react';
import { List as IList, Map as IMap } from 'immutable';
import { statusConstants } from 'molecular-design-applications-shared';
import SelectionRecord from '../records/selection_record';
import StatusAbout from './status_about';
import StatusLigandSelection from './status_ligand_selection';
import StatusLoad from './status_load';
import StatusRun from './status_run';
import StatusInteractiveSim from './status_interactive_sim';
import StatusResults from './status_results';
import WorkflowRecord from '../records/workflow_record';
import ioUtils from '../utils/io_utils';
import selectionConstants from '../constants/selection_constants';
import workflowUtils from '../utils/workflow_utils';

require('../../css/status.scss');

function Status(props) {
  const runCompleted = props.workflow.run.status === statusConstants.COMPLETED;

  let selection;
  if (!props.hideContent) {
    if (props.selection.type === selectionConstants.NODE) {
      const node = props.nodes.get(props.selection.id);
      selection = (
        <div className="status-info">
          <p>Node</p>
          <p>{node.title}</p>
        </div>
      );
    } else if (props.selection.type === selectionConstants.WORKFLOW) {
      const lastWorkflowNode = props.workflow.workflowNodes.last();
      let output;
      if (lastWorkflowNode && lastWorkflowNode.outputs.size) {
        output = (
          <p>
            Output:
            <a href={lastWorkflowNode.outputs.get(0).get('value')}>
              {lastWorkflowNode.outputs.get(0).get('value')}
            </a>
          </p>
        );
      }
      selection = (
        <div className="status-info">
          <p>Workflow</p>
          <p>{props.workflow.title}</p>
          <p>Status: {props.workflow.run.status}</p>
          {output}
        </div>
      );
    } else if (props.selection.type === selectionConstants.WORKFLOW_NODE) {
      const workflowNode = props.workflow.workflowNodes.find(workflowNodeI =>
        workflowNodeI.id === props.selection.id,
      );
      const node = workflowNode.node;

      let output;
      if (workflowNode.outputs && workflowNode.outputs.size) {
        output = (
          <p>
            Output:
            <a href={workflowNode.outputs.get(0).get('value')}>
              {workflowNode.outputs.get(0).get('value')}
            </a>
          </p>
        );
      }

      selection = (
        <div className="status-info">
          <p>Node in Workflow &#34;{props.workflow.title}&#34;</p>
          <p>{node.title}</p>
          <p>Status: {workflowNode.status}</p>
          {output}
        </div>
      );
    } else if (!props.workflow.fetching && !props.workflow.fetchingError &&
      props.selection.type === selectionConstants.WORKFLOW_NODE_LOAD) {
      selection = (
        <StatusLoad
          fetchingData={props.workflow.run.fetchingData}
          inputData={ioUtils.getPdb(props.workflow.run.inputs)}
          inputFileError={props.workflow.run.inputFileError}
          inputString={props.workflow.run.inputString}
          inputStringError={props.workflow.run.inputStringError}
          onSelectInputFile={props.onSelectInputFile}
          runCompleted={runCompleted}
          submitInputString={props.submitInputString}
        />
      );
    } else if (props.selection.type === selectionConstants.WORKFLOW_NODE_RUN) {
      const running = props.workflow.run.status === statusConstants.RUNNING;
      const runDisabled = running || runCompleted ||
        !workflowUtils.isRunnable(props.workflow.run);
      selection = (
        <StatusRun
          clickRun={props.clickRun}
          email={props.workflow.run.email}
          emailError={props.workflow.run.emailError}
          runCompleted={runCompleted}
          runDisabled={runDisabled}
          submitEmail={props.submitEmail}
        />
      );
    } else if (props.selection.type === selectionConstants.WORKFLOW_NODE_INTERACTIVE_SIM) {
      const lammpsModelData = ioUtils.getLammpsData(props.workflow.run.inputs);
      selection = (
        <StatusInteractiveSim
          modelData={lammpsModelData}
        />
      );
    } else if (
      props.selection.type === selectionConstants.WORKFLOW_NODE_RESULTS &&
      props.workflow.run.outputs.size
    ) {
      const outputResultsIndex = ioUtils.getIndexByExtension(
        props.workflow.run.outputs, 'results.json',
      );
      let resultValues;

      if (outputResultsIndex !== -1) {
        const outputResults = props.workflow.run.outputs.get(outputResultsIndex)
          .fetchedValue;

        if (outputResults.output_values) {
          resultValues = new IList(outputResults.output_values);
        }
      }

      const pdbIndex = ioUtils.getIndexByExtension(
        props.workflow.run.outputs, '.pdb',
      );
      const outputPdbUrl = props.workflow.run.outputs.get(pdbIndex).value;

      selection = (
        <StatusResults
          morph={props.morph}
          numberOfPdbs={props.numberOfPdbs}
          onClickColorize={props.onClickColorize}
          onChangeMorph={props.onChangeMorph}
          workflowNodesSize={props.workflow.workflowNodes.size}
          resultValues={resultValues}
          outputPdbUrl={outputPdbUrl}
        />
      );
    } else if (
      props.selection.type === selectionConstants.WORKFLOW_NODE_LIGAND_SELECTION
    ) {
      selection = (
        <StatusLigandSelection
          changeLigandSelection={props.changeLigandSelection}
          ligandNames={ioUtils.getLigandNames(props.workflow.run.inputs)}
          runCompleted={runCompleted}
          selectedLigand={props.selectedLigand}
        />
      );
    } else if (props.selection.type === selectionConstants.ABOUT) {
      selection = (
        <StatusAbout />
      );
    }
  }

  return (
    <div className={`status ${props.selection.type ? '' : 'placeholder-container'}`}>
      {selection}
    </div>
  );
}

Status.defaultProps = {
  hideContent: false,
  selectedLigand: '',
  workflow: null,
};

Status.propTypes = {
  changeLigandSelection: React.PropTypes.func.isRequired,
  clickRun: React.PropTypes.func.isRequired,
  fetching: React.PropTypes.bool.isRequired,
  fetchingData: React.PropTypes.bool.isRequired,
  hideContent: React.PropTypes.bool,
  morph: React.PropTypes.number.isRequired,
  nodes: React.PropTypes.instanceOf(IMap).isRequired,
  numberOfPdbs: React.PropTypes.number.isRequired,
  onClickColorize: React.PropTypes.func.isRequired,
  onChangeMorph: React.PropTypes.func.isRequired,
  selectedLigand: React.PropTypes.string,
  onSelectInputFile: React.PropTypes.func.isRequired,
  selection: React.PropTypes.instanceOf(SelectionRecord).isRequired,
  submitInputString: React.PropTypes.func.isRequired,
  submitEmail: React.PropTypes.func.isRequired,
  workflow: React.PropTypes.instanceOf(WorkflowRecord),
};

export default Status;
