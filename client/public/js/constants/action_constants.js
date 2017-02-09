import keyMirror from 'keymirror';

const actionConstants = keyMirror({
  CHANGE_LIGAND_SELECTION: null,
  CHANGE_MORPH: null,
  CLICK_ABOUT: null,
  CLICK_CANCEL: null,
  CLICK_COLORIZE: null,
  CLICK_NODE: null,
  CLICK_RUN: null,
  CLICK_WORKFLOW_NODE: null,
  CLICK_WORKFLOW_NODE_LIGAND_SELECTION: null,
  CLICK_WORKFLOW_NODE_LOAD: null,
  CLICK_WORKFLOW_NODE_EMAIL: null,
  CLICK_WORKFLOW_NODE_RESULTS: null,
  FETCHED_PDB_BY_ID: null,
  FETCHED_WORKFLOW: null,
  FETCHED_RUN: null,
  FETCHED_RUN_IO: null,
  GET_PDB: null,
  INPUT_FILE: null,
  INPUT_FILE_COMPLETE: null,
  INITIALIZE: null,
  INITIALIZE_WORKFLOW: null,
  MESSAGE_TIMEOUT: null,
  RUN_SUBMITTED: null,
  SUBMIT_PDB_ID: null,
  SUBMIT_EMAIL: null,
  SUBMITTED_CANCEL: null,
});

export default actionConstants;
