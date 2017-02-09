const cccUtils = require('../utils/ccc_utils');

const WORKFLOW_IMAGE = 'avirshup/mst:workflows-0.0.1b2';

const workflowUtils = {
  /**
   * Performs a CCC job.
   * @param  {BasicBatchProcessRequest} jobJson https://github.com/dionjwa/cloud-compute-cannon/blob/master/src/haxe/ccc/compute/shared/Definitions.hx typedef BasicBatchProcessRequest
   * @return {JobResult} https://github.com/dionjwa/cloud-compute-cannon/blob/master/src/haxe/ccc/compute/shared/Definitions.hx typedef JobResult
   */
  executeCCCJob(jobJson) {
    /* If this is a local dev docker-compose setup, mount the local ccc server to the workflow container */
    jobJson['mountApiServer'] = process.env["CCC"] == "ccc:9000";

    if (!jobJson.createOptions) {
      jobJson.createOptions = {};
    }
    if (!jobJson.createOptions.Env) {
      jobJson.createOptions.Env = [];
    }

    jobJson.appendStdOut = true;
    jobJson.appendStdErr = true;

    jobJson.createOptions.Env.push(`CCC=${process.env["CCC"]}`);

    return cccUtils.promise()
      .then(ccc => {
        return ccc.submitJobJson(jobJson);
      });
  },

  /**
   * https://docs.google.com/presentation/d/1qP-8fPpsgtJnZOlg96ySwPACZvGlxT1jIIgjBECoDAE/edit#slide=id.g1c36f8ea4a_0_0
   * @param  {Array<ComputeInputSource>} inputs https://github.com/dionjwa/cloud-compute-cannon/blob/master/src/haxe/ccc/compute/shared/Definitions.hx
   *         e.g. inputs: [
   *           {
   *             name: "input.pdb",
   *             type: "url",
   *             value: "http://s3.location.input.pdb"
   *           },
   *           {
   *             name: "other.file",
   *             type: "inline",
   *             value: "Actual file content string"
   *           }
   *         ]
   * @return {success:Bool, outputs:Object[filename] = <URL to file>, jobResult:JobResult
   */
  executeWorkflow0Step0(inputs) {

    const jobJson = {
      wait: true,
      image: WORKFLOW_IMAGE,
      inputs: inputs,
      createOptions: {
        Cmd: ['vde',
          '--preprocess', `/inputs/${inputs[0].name}`,
          '--outputdir', '/outputs/'
        ]
      }
    };
    log.debug({execute:'executeWorkflow0Step0', job:JSON.stringify(jobJson).substr(0, 100)});
    return workflowUtils.executeCCCJob(jobJson)
      .then(jobResult => {
        var outputs = [];
        for (var i = 0; i < jobResult.outputs.length; i++) {
          outputs.push({
            name: jobResult.outputs[i],
            type: 'url',
            value: `${jobResult.outputsBaseUrl}${jobResult.outputs[i]}`,
          });
        }

        return {
          success: jobResult.exitCode == 0,
          outputs: outputs,
          jobResult: jobResult
        }
      });
  },

  /**
   * https://docs.google.com/presentation/d/1qP-8fPpsgtJnZOlg96ySwPACZvGlxT1jIIgjBECoDAE/edit#slide=id.g1c36f8ea4a_0_0
   * @param  {Array<ComputeInputSource>} inputs https://github.com/dionjwa/cloud-compute-cannon/blob/master/src/haxe/ccc/compute/shared/Definitions.hx
   *         e.g. inputs: [
   *           {
   *             name: "input.pdb",
   *             type: "url",
   *             value: "http://s3.location.input.pdb"
   *           },
   *           {
   *             name: "other.file",
   *             type: "inline",
   *             value: "Actual file content string"
   *           }
   *         ]
   * @return {success:Bool, outputs:Object[filename] = <URL to file>, jobResult:JobResult
   */
  executeWorkflow0Step1(inputs) {
    const jobJson = {
      wait: false,
      image: WORKFLOW_IMAGE,
      inputs: inputs,
      createOptions: {
        WorkingDir: '/outputs',
        Cmd: ['vde',
          '--restart', '/inputs/workflow_state.dill',
          '--outputdir', '/outputs/']
      }
    };
    return workflowUtils.executeCCCJob(jobJson)
      .then(jobResult => {
        //Return the jobId as the runId
        return jobResult.jobId;
      });
  },

  /**
   * https://docs.google.com/presentation/d/1qP-8fPpsgtJnZOlg96ySwPACZvGlxT1jIIgjBECoDAE/edit#slide=id.g1c36f8ea4a_0_0
   * @param  {Array<ComputeInputSource>} inputs https://github.com/dionjwa/cloud-compute-cannon/blob/master/src/haxe/ccc/compute/shared/Definitions.hx
   *         e.g. inputs: [
   *           {
   *             name: "input.pdb",
   *             type: "url",
   *             value: "http://s3.location.input.pdb"
   *           },
   *           {
   *             name: "other.file",
   *             type: "inline",
   *             value: "Actual file content string"
   *           }
   *         ]
   * @return {success:Bool, outputs:Object[filename] = <URL to file>, jobResult:JobResult
   */
  executeWorkflow1Step0(inputs) {
    const jobJson = {
      wait: true,
      image: WORKFLOW_IMAGE,
      inputs: inputs,
      createOptions: {
        Cmd: ['minimize',
          '--preprocess', `/inputs/${inputs[0].name}`,
          '--outputdir', '/outputs/']
      }
    };

    log.debug({execute:'executeWorkflow1Step0', job:JSON.stringify(jobJson).substr(0, 100)});
    return workflowUtils.executeCCCJob(jobJson)
      .then(jobResult => {
        var outputs = [];
        for (var i = 0; i < jobResult.outputs.length; i++) {
          outputs.push({
            name: jobResult.outputs[i],
            type: 'url',
            value: `${jobResult.outputsBaseUrl}${jobResult.outputs[i]}`,
          });
        }
        return {
          success: jobResult.exitCode == 0,
          outputs: outputs,
          jobResult: jobResult
        }
      });
  },


  /**
   * https://docs.google.com/presentation/d/1qP-8fPpsgtJnZOlg96ySwPACZvGlxT1jIIgjBECoDAE/edit#slide=id.g1c36f8ea4a_0_0
   * @param  {Array<ComputeInputSource>} inputs https://github.com/dionjwa/cloud-compute-cannon/blob/master/src/haxe/ccc/compute/shared/Definitions.hx
   *         e.g. inputs: [
   *           {
   *             name: "input.pdb",
   *             type: "url",
   *             value: "http://s3.location.input.pdb"
   *           },
   *           {
   *             name: "other.file",
   *             type: "inline",
   *             value: "Actual file content string"
   *           }
   *         ]
   * @return {success:Bool, outputs:Object[filename] = <URL to file>, jobResult:JobResult
   */
  executeWorkflow1Step1(inputs) {
    log.debug({f:'executeWorkflow1Step1', inputs});
    const jobJson = {
      wait: false,
      image: WORKFLOW_IMAGE,
      inputs: inputs,
      createOptions: {
        Cmd: ['minimize',
          '--restart', '/inputs/workflow_state.dill',
          '--setoutput', 'user_atom_selection=/inputs/selection.json',
          '--outputdir', '/outputs/']
      }
    };
    return workflowUtils.executeCCCJob(jobJson)
      .then(jobResult => {
        //Return the jobId as the runId
        return jobResult.jobId;
      });
  },

  /**
   * Gets the total number of runs per workflow and returns the results in a
   * hash, given the runStrings in the db
   * @param runHash {Array of Strings}
   * @returns {Map}
   */
  getRunCountsByWorkflows(runHash) {
    const runCounts = new Map();

    Object.values(runHash).forEach((runString) => {
      const run = JSON.parse(runString);

      if (!runCounts.has(run.workflowId)) {
        runCounts.set(run.workflowId, 0);
      }

      runCounts.set(run.workflowId, runCounts.get(run.workflowId) + 1);
    });

    return runCounts;
  },
};

module.exports = workflowUtils;
