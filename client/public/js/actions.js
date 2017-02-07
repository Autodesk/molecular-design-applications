import { browserHistory } from 'react-router';
import actionConstants from './constants/action_constants';
import apiUtils from './utils/api_utils';
import rcsbApiUtils from './utils/rcsb_api_utils';
import workflowUtils from './utils/workflow_utils';

export function initializeWorkflow(workflowId) {
  return async function initializeWorkflowDispatch(dispatch) {
    dispatch({
      type: actionConstants.INITIALIZE_WORKFLOW,
      workflowId,
    });

    let workflow;
    try {
      workflow = await apiUtils.getWorkflow(workflowId);
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
      return dispatch({
        type: actionConstants.FETCHED_RUN,
        error,
      });
    }

    dispatch({
      type: actionConstants.FETCHED_RUN,
      workflow,
    });

    let inputPdbUrl = null;
    let i = 0;
    for (i = 0; i < workflow.run.inputs.length; i++) {
      if (workflow.run.inputs[i].name === 'prep.pdb') {
        inputPdbUrl = workflow.run.inputs[i].value;
        break;
      }
    }

    let finalOutputPdbUrl = null;
    for (i = 0; i < workflow.run.outputs.length; i++) {
      if (workflow.run.outputs[i].name === 'final_structure.pdb') {
        finalOutputPdbUrl = workflow.run.outputs[i].value;
        break;
      }
    }

    if (inputPdbUrl) {
      apiUtils.getPdb(inputPdbUrl).then(modelData =>
        dispatch({
          type: actionConstants.FETCHED_INPUT_PDB,
          modelData,
        })
      ).catch(error =>
        dispatch({
          type: actionConstants.FETCHED_INPUT_PDB,
          err: error,
        })
      );
    }

    if (finalOutputPdbUrl) {
      apiUtils.getPdb(finalOutputPdbUrl).then(modelData =>
        dispatch({
          type: actionConstants.FETCHED_OUTPUT_PDB,
          modelData,
        })
      ).catch(error =>
        dispatch({
          type: actionConstants.FETCHED_OUTPUT_PDB,
          err: error,
        })
      );
    }

    return true;
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

export function clickRun(workflowId, email, inputs) {
  return (dispatch) => {
    dispatch({
      type: actionConstants.CLICK_RUN,
    });

    apiUtils.run(workflowId, email, inputs).then((runId) => {
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
    if (extension !== 'pdb') {
      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        error: 'File must have the .pdb extension',
      });
      return;
    }

    try {
      const inputPdb = await workflowUtils.readPdb(file);
      const inputs = await workflowUtils.processInput(workflowId, inputPdb);

      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        inputs,
      });
    } catch (err) {
      console.error(err);
      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        error: err ? (err.message || err) : null,
      });
    }
  };
}

export function submitPdbId(pdbId, workflowId) {
  return async function submitPdbIdDispatch(dispatch) {
    dispatch({
      type: actionConstants.SUBMIT_PDB_ID,
    });

    try {
      const pdbDownload = await rcsbApiUtils.getPdbById(pdbId);
      const inputs = await workflowUtils.processInput(workflowId, pdbDownload.pdb);

      dispatch({
        type: actionConstants.FETCHED_PDB_BY_ID,
        inputs,
      });
    } catch (err) {
      console.error(err);
      dispatch({
        type: actionConstants.FETCHED_PDB_BY_ID,
        error: err.message || err,
      });
    }
  };
}

export function submitEmail(email) {
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

export function changeMorph(morph) {
  return {
    type: actionConstants.CHANGE_MORPH,
    morph,
  };
}
