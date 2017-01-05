import { Map as IMap, List as IList } from 'immutable';
import NodeRecord from '../records/node_record';
import WorkflowNodeRecord from '../records/workflow_node_record';
import WorkflowRecord from '../records/workflow_record';
import { statusConstants } from 'molecular-design-applications-shared';

const mockApiUtils = {
  run(nodeIds) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 20% chance of failing
        const err = Math.random() > 0.8;
        if (err) {
          return reject(err);
        }

        const runId = Math.round(Math.random() * 1000).toString();
        const workflowNodesData = nodeIds.map(nodeId => ({
          id: nodeId,
          outputs: [{
            value: 'https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb',
          }],
        }));

        return resolve({
          workflowNodesData,
          runId,
        });
      }, 1000);
    });
  },

  getGallery() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const err = false; // TODO no error handling yet
        let defaultNodes = new IMap();
        defaultNodes = defaultNodes.set(0, new NodeRecord({ id: 0, title: 'Download PDB File' }));
        defaultNodes = defaultNodes.set(1, new NodeRecord({ id: 1, title: 'Add Hydrogens' }));
        defaultNodes = defaultNodes.set(2, new NodeRecord({ id: 2, title: 'Strip Water' }));
        defaultNodes = defaultNodes.set(3, new NodeRecord({ id: 3, title: 'Assign Forcefield' }));
        defaultNodes = defaultNodes.set(4, new NodeRecord({ id: 4, title: 'Minimize' }));

        if (err) {
          return reject(err);
        }

        return resolve(defaultNodes);
      }, 1000);
    });
  },

  getPDB(url) {
    return fetch(url).then(res =>
      res.text()
    );
  },

  getModelData(url) {
    return fetch(url).then(res =>
      res.json()
    );
  },

  upload(file) {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop();
      if (extension !== 'pdb') {
        return reject('File must have the .pdb extension.');
      }

      return setTimeout(() => {
        // 20% chance of failing
        const err = Math.random() > 0.8;

        if (err) {
          return reject('Upload failed due to swamp gas interference.');
        }

        return resolve('https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb');
      }, 2000);
    });
  },

  getWorkflow(workflowId) {
    // TODO fake api endpoint for now
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 20% chance of failing
        const err = Math.random() > 0.8;

        if (err) {
          return reject('Fail');
        }

        const workflowNodes = new IList([
          new WorkflowNodeRecord({
            id: 0,
            node: new NodeRecord({
              id: 0,
              title: 'Load PDB',
            }),
          }),
          new WorkflowNodeRecord({
            id: 1,
            node: new NodeRecord({
              id: 1,
              title: 'Add Hydrogens',
            }),
          }),
        ]);

        return resolve(new WorkflowRecord({
          id: workflowId,
          title: 'Refine ligand and active site in molecules',
          workflowNodes,
        }));
      }, 1000);
    });
  },

  getRun(workflowId, runId) {
    // TODO fake api endpoint for now
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 20% chance of failing
        const err = Math.random() > 0.8;

        if (err) {
          return reject('Fail');
        }

        // random outcome
        const randomStatus = Math.random();
        let workflowNodeStatus;
        let workflowNodeOutputs = [];
        if (randomStatus < 0.5) {
          workflowNodeStatus = statusConstants.RUNNING;
        } else if (randomStatus < 0.75) {
          workflowNodeStatus = statusConstants.COMPLETED;
          workflowNodeOutputs = [{
            value: 'https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb',
          }];
        } else {
          workflowNodeStatus = statusConstants.ERROR;
        }

        const workflowNodes = new IList([
          new WorkflowNodeRecord({
            id: 0,
            runId,
            node: new NodeRecord({
              id: 0,
              title: 'Load PDB',
            }),
            status: statusConstants.COMPLETED,
            outputs: [{
              value: 'https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb',
            }],
          }),
          new WorkflowNodeRecord({
            id: 1,
            node: new NodeRecord({
              id: 1,
              title: 'Add Hydrogens',
            }),
            status: workflowNodeStatus,
            outputs: workflowNodeOutputs,
          }),
        ]);

        return resolve(new WorkflowRecord({
          id: workflowId,
          runId,
          title: 'Refine ligand and active site in molecules',
          email: 'justin.mccandless@autodesk.com',
          workflowNodes,
        }));
      }, 1000);
    });
  },

  getPdbById() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 20% chance of failing
        const err = Math.random() > 0.8;

        if (err) {
          return reject(new Error('Fail'));
        }

        return resolve('https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb');
      }, 1000);
    });
  },

  cancelRun() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 20% chance of failing
        const err = Math.random() > 0.8;

        if (err) {
          return reject(new Error('Fail'));
        }

        return resolve();
      }, 1000);
    });
  },
};

export default mockApiUtils;
