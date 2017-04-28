import keyMirror from 'keymirror';

const interactiveSimConstants = keyMirror({
  // Worker Onmessage Constants
  MESSAGE_GROUP_ATOMS: null,

  MESSAGE_LANGEVIN: null,
  MESSAGE_FIX_RECENTER: null,
  MESSAGE_FIX_SHAKE: null,

  MESSAGE_DRAG_MOLECULE: null,
  MESSAGE_PULL_MOLECULE: null,

  MESSAGE_RUN_DYNAMICS: null,
  MESSAGE_RUN_MINIMIZATION: null,

  MESSAGE_REMOVE_FILE: null,
  MESSAGE_CLEAR_SYSTEM: null,

  MESSAGE_WORKER_TERMINATE: null,

  // Index Onmessage Constants
  MESSAGE_PERFORMANCE: null,
  MESSAGE_ERROR: null,
  MESSAGE_POSITION_DATA: null,
  MESSAGE_ENERGY_DATA: null,

  MESSAGE_WORKER_READY: null,

  // Worker && Index Onmessage Constants
  MESSAGE_SAVE_SNAPSHOT: null,
  MESSAGE_LAMMPS_DATA: null,
  MESSAGE_SNAPSHOT_DATA: null,

  // Name Constants
  NAME_GROUP_INTERACTION: null,
  NAME_SHAKE_HYDROGEN: null,
  NAME_VIEWER_INTERACTION_TOOL: null,
});

export default interactiveSimConstants;
