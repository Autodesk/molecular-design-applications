import axios from 'axios';
import RunRecord from '../records/run_record';
import WorkflowRecord from '../records/workflow_record';

const API_URL = process.env.API_URL || '';

const apiUtils = {
  run(workflowId, email, inputPdb) {
    return axios.post(`${API_URL}/v1/run`, {
      workflowId,
      email,
      pdb: inputPdb,
    }).then(res => res.data.runId);
  },

  getPdb(url) {
    return axios.get(url).then(res => res.data);
  },

  getWorkflow(workflowId) {
    return axios.get(`${API_URL}/v1/workflow/${workflowId}`).then(res =>
      new WorkflowRecord(res.data)
    );
  },

  getWorkflows() {
    return axios.get(`${API_URL}/v1/workflow`).then(res =>
      res.data.map(workflowData => new WorkflowRecord(workflowData))
    );
  },

  getRun(runId) {
    return axios.get(`${API_URL}/v1/run/${runId}`).then(res =>
      res.data
    ).then(runData =>
      new WorkflowRecord(Object.assign({}, runData, runData.workflow, {
        run: new RunRecord(runData),
      }))
    );
  },

  cancelRun(runId) {
    return axios.post(`${API_URL}/v1/run/cancel`, {
      runId,
    });
  },

  processInput(workflowId, pdb) {
    // TODO backend should handle distinguishing by workflowId
    if (workflowId !== '1') {
      return Promise.resolve();
    }

    const file = new window.Blob(
      [pdb], { type: 'text/pdb' }
    );
    const data = new window.FormData();
    data.append('file', file);

    return axios.post(`${API_URL}/v1/structure/executeWorkflow1Step0`, data)
      .then(res => res.data.prepPdb);
  },
};

export default apiUtils;
