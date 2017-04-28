import { browserHistory } from 'react-router';
import isEmail from 'validator/lib/isEmail';
import actionConstants from './constants/action_constants';
import apiUtils from './utils/api_utils';
import ioUtils from './utils/io_utils';
import rcsbApiUtils from './utils/rcsb_api_utils';
import workflowUtils from './utils/workflow_utils';

const FILE_INPUT_EXTENSIONS = ['pdb', 'xyz', 'sdf', 'mol2'];

export function initializeWorkflow(workflowId) {
  return async function initializeWorkflowDispatch(dispatch) {
    dispatch({
      type: actionConstants.INITIALIZE_WORKFLOW,
      workflowId,
    });

    let workflow;
    try {
      workflow = await apiUtils.getWorkflow(workflowId);

      if (workflow.comingSoon) {
        throw new Error('This workflow is not yet available, please try another.');
      }
    } catch (error) {
      return dispatch({
        type: actionConstants.FETCHED_WORKFLOW,
        error,
      });
    }

    return dispatch({
      type: actionConstants.FETCHED_WORKFLOW,
      workflow,
    });
  };
}

export function initializeRun(workflowId, runId) {
  return async function initializeRunDispatch(dispatch) {
    dispatch({
      type: actionConstants.INITIALIZE_WORKFLOW,
      runId,
      workflowId,
    });

    let workflow;
    try {
      workflow = await apiUtils.getRun(runId);
    } catch (error) {
      dispatch({
        type: actionConstants.FETCHED_RUN,
        error,
      });
      return;
    }

    dispatch({
      type: actionConstants.FETCHED_RUN,
      workflow,
    });

    try {
      let inputs = workflow.run.inputs;
      let outputs = workflow.run.outputs;

      inputs = await workflowUtils.fetchIoPdbs(inputs);
      inputs = await workflowUtils.fetchIoResults(inputs);
      outputs = await workflowUtils.fetchIoPdbs(outputs);
      outputs = await workflowUtils.fetchIoResults(outputs);

      // If only one ligand, select it
      const ligands = ioUtils.getLigandNames(inputs);
      if (ligands.size === 1) {
        inputs = ioUtils.selectLigand(inputs, ligands.get(0));
      }

      dispatch({
        type: actionConstants.FETCHED_RUN_IO,
        inputs,
        outputs,
      });
    } catch (error) {
      console.error(error);
      dispatch({
        type: actionConstants.FETCHED_RUN_IO,
        error: error ? (error.message || error) : null,
      });
    }
  };
}

export function clickNode(nodeId) {
  return {
    type: actionConstants.CLICK_NODE,
    nodeId,
  };
}

// TODO this is unused now that we don't show workflow nodes, but in future?
export function clickWorkflowNode(workflowNodeId) {
  return {
    type: actionConstants.CLICK_WORKFLOW_NODE,
    workflowNodeId,
  };
}

export function clickWorkflowNodeLigandSelection() {
  return {
    type: actionConstants.CLICK_WORKFLOW_NODE_LIGAND_SELECTION,
  };
}

export function clickWorkflowNodeLoad() {
  return {
    type: actionConstants.CLICK_WORKFLOW_NODE_LOAD,
  };
}

export function clickWorkflowNodeEmail() {
  return {
    type: actionConstants.CLICK_WORKFLOW_NODE_EMAIL,
  };
}

export function clickWorkflowNodeResults() {
  return {
    type: actionConstants.CLICK_WORKFLOW_NODE_RESULTS,
  };
}

export function clickWorkflowNodeInteractiveSim() {
  return {
    type: actionConstants.CLICK_WORKFLOW_NODE_INTERACTIVE_SIM,
  };
}

/**
 * When the user clicks on the run button
 * @param {String} workflowId
 * @param {String} email
 * @param {IList} inputs
 * @param {String} [inputString]
 */
export function clickRun(workflowId, email, inputs, inputString) {
  return (dispatch) => {
    dispatch({
      type: actionConstants.CLICK_RUN,
    });

    const selectedLigand = ioUtils.getSelectedLigand(inputs);

    apiUtils.run(workflowId, email, inputs, selectedLigand, inputString).then((runId) => {
      dispatch({
        type: actionConstants.RUN_SUBMITTED,
        runId,
      });

      browserHistory.push(`/workflow/${workflowId}/${runId}`);
      dispatch(initializeRun(workflowId, runId));
    }).catch((err) => {
      console.error(err);

      dispatch({
        type: actionConstants.RUN_SUBMITTED,
        err,
      });
    });
  };
}

export function selectInputFile(file, workflowId) {
  return async function selectInputFileDispatch(dispatch) {
    dispatch({
      type: actionConstants.INPUT_FILE,
      file,
    });

    const extension = file.name.split('.').pop();
    if (!FILE_INPUT_EXTENSIONS.includes(extension.toLowerCase())) {
      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        error: 'File has invalid extension.',
      });
      return;
    }

    try {
      const inputString = await workflowUtils.readFile(file);
      let inputs = await workflowUtils.processInput(
        workflowId, inputString, extension,
      );

      // If only one ligand, select it
      const ligands = ioUtils.getLigandNames(inputs);
      if (ligands.size === 1) {
        inputs = ioUtils.selectLigand(inputs, ligands.get(0));
      }

      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        inputs,
      });
    } catch (err) {
      console.error(err);
      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        error: err ? (err.message || err) : null,
        inputs: err ? err.inputs : null,
      });
    }
  };
}

export function submitInputString(inputString, workflowId) {
  return async function submitInputStringDispatch(dispatch) {
    dispatch({
      type: actionConstants.SUBMIT_INPUT_STRING,
      inputString,
    });

    // If the input is 4 characters, try it as a pdbid first
    let pdbDownload;
    if (inputString.length === 4) {
      try {
        pdbDownload = await rcsbApiUtils.getPdbById(inputString);
      } catch (error) {
        console.log(`Failed to fetch ${inputString} as pdbid, will try directly.`);
      }
    }

    try {
      const newInput = pdbDownload ? pdbDownload.pdb : inputString;
      const extension = pdbDownload ? '.pdb' : '';
      let inputs = await workflowUtils.processInput(
        workflowId, newInput, extension,
      );

      // If only one ligand, select it
      const ligands = ioUtils.getLigandNames(inputs);
      if (ligands.size === 1) {
        inputs = ioUtils.selectLigand(inputs, ligands.get(0));
      }

      dispatch({
        type: actionConstants.PROCESSED_INPUT_STRING,
        inputs,
      });
    } catch (err) {
      console.error(err);
      dispatch({
        type: actionConstants.PROCESSED_INPUT_STRING,
        error: err.message || err,
        inputs: err ? err.inputs : null,
      });
    }
  };
}

export function submitEmail(email) {
  if (!isEmail(email)) {
    return {
      type: actionConstants.SUBMIT_EMAIL,
      error: 'Invalid email',
    };
  }

  return {
    type: actionConstants.SUBMIT_EMAIL,
    email,
  };
}

export function clickAbout() {
  return {
    type: actionConstants.CLICK_ABOUT,
  };
}

export function clickCancel(runId) {
  return (dispatch) => {
    dispatch({
      type: actionConstants.CLICK_CANCEL,
    });

    apiUtils.cancelRun(runId).then(() => {
      dispatch({
        type: actionConstants.SUBMITTED_CANCEL,
      });
    }).catch((err) => {
      dispatch({
        type: actionConstants.SUBMITTED_CANCEL,
        err,
      });
    });
  };
}

export function messageTimeout() {
  return {
    type: actionConstants.MESSAGE_TIMEOUT,
  };
}

export function clickColorize() {
  return {
    type: actionConstants.CLICK_COLORIZE,
  };
}

export function changeLigandSelection(inputs, ligand) {
  return {
    type: actionConstants.CHANGE_LIGAND_SELECTION,
    inputs: ioUtils.selectLigand(inputs, ligand),
  };
}

export function changeMorph(morph) {
  return {
    type: actionConstants.CHANGE_MORPH,
    morph,
  };
}
