import isEmail from 'validator/lib/isEmail';
import { statusConstants } from 'molecular-design-applications-shared';
import apiUtils from './api_utils';
import ioUtils from './io_utils';

const workflowUtils = {
  /**
   * Given a list of workflowNodes, return the overall status of the workflow
   * @param workflowNodes {Immutable.List}
   * @returns {String}
  */
  getWorkflowStatus(workflowNodes) {
    if (!workflowNodes.size) {
      return statusConstants.IDLE;
    }

    let atLeastOneCanceled = false;
    let atLeastOneError = false;
    let allCompleted = true;
    let allIdle = true;

    for (let i = 0; i < workflowNodes.size; i += 1) {
      const workflowNode = workflowNodes.get(i);

      if (workflowNode.status === statusConstants.ERROR) {
        atLeastOneError = true;
        break;
      } else if (workflowNode.status === statusConstants.CANCELED) {
        atLeastOneCanceled = true;
        break;
      } else if (workflowNode.status === statusConstants.RUNNING) {
        allCompleted = false;
        allIdle = false;
      } else if (workflowNode.status === statusConstants.COMPLETED) {
        allIdle = false;
      } else if (workflowNode.status === statusConstants.IDLE) {
        allCompleted = false;
      }
    }

    if (atLeastOneCanceled) {
      return statusConstants.CANCELED;
    }
    if (atLeastOneError) {
      return statusConstants.ERROR;
    }
    if (allCompleted) {
      return statusConstants.COMPLETED;
    }
    if (allIdle) {
      return statusConstants.IDLE;
    }

    return statusConstants.RUNNING;
  },

  isRunnable(run) {
    if (!ioUtils.getInputPdb(run.inputs)) {
      return false;
    }
    if (!isEmail(run.email)) {
      return false;
    }
    if (run.status === statusConstants.RUNNING) {
      return false;
    }
    if (run.fetching) {
      return false;
    }

    return true;
  },

  readPdb(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  /**
   * Using the api, go through the full step0 input processing flow
   * Calls to this should be surrounded by try/catch!
   * @param workflowId {String}
   * @param pdb {String}
   * @returns {Array}
   */
  processInput: async function processInput(workflowId, pdb) {
    let inputs = await apiUtils.processInputPdb(workflowId, pdb);

    // Find the json status input
    inputs = await workflowUtils.fetchIoResults(inputs);

    // Get the processed input pdb
    inputs = await workflowUtils.fetchIoPdbs(inputs);

    return inputs;
  },

  /**
   * Fetch the results json for any of the given ios with a json url.
   * Return new ios with fetchedResult set for the json.
   * @param ios {IList}
   * @returns {Promise that resolves with IList}
   */
  fetchIoResults(ios) {
    let newIos = ios;

    return Promise.all(ios.map((io) => {
      if (io.value.endsWith('.json')) {
        return Promise.resolve();
      }
      return apiUtils.getIoData(io.value).then((results) => {
        // Set newIos to a new list that contains the fetched results data
        newIos = newIos.set(
          newIos.indexOf(io), io.set('fetchedValue', results),
        );
      });

    // Resolve with the new list of ios
    })).then(() => newIos);
  },

  /**
   * Fetch the pdb for any of the given ios with a pdb url.
   * Return new ios with fetchedResult set for the pdb data.
   * @param ios {IList}
   * @returns {Promise that resolves with an IList}
   */
  fetchIoPdbs(ios) {
    let newIos = ios;

    return Promise.all(ios.map((io) => {
      if (io.value.endsWith('.pdb')) {
        return Promise.resolve();
      }
      return apiUtils.getPdb(io.value).then((results) => {
        // Set newIos to a new list that contains the fetched pdb
        newIos = newIos.set(
          newIos.indexOf(io), io.set('fetchedValue', results),
        );
      });

    // Resolve with the new list of ios
    })).then(() => newIos);
  },
};

export default workflowUtils;
