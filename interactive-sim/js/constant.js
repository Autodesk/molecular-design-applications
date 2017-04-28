/********************** Value Constants *************************/
const VALUE_MAX_SNAPSHOTS = 5;

/****************** Worker Onmessage Cosntants ******************/
const MESSAGE_RUN_DYNAMICS = 'run_dynamics';
const MESSAGE_LANGEVIN = 'langevin_setting';

const MESSAGE_GROUP_ATOMS = 'group_atom_by_index';

const MESSAGE_DRAG_MOLECULE = 'drag';
const MESSAGE_PULL_MOLECULE = 'pull';
const MESSAGE_RUN_MINIMIZATION = 'run_minimization';

const MESSAGE_REMOVE_FILE = 'remove_file';
const MESSAGE_CLEAR_SYSTEM = 'clear';

const MESSAGE_WORKER_TERMINATE = 'worker_terminate';

const MESSAGE_FIX_RECENTER = 'fix_recenter';
const MESSAGE_FIX_SHAKE = 'fix_shake';

/****************** Index Onmessage Constants ******************/
const MESSAGE_PERFORMANCE = 'performance';
const MESSAGE_ERROR = 'error';
const MESSAGE_POSITION_DATA = 'position';
const MESSAGE_ENERGY_DATA = 'energy';

const MESSAGE_WORKER_READY = 'worker_ready';

/*************** Worker && Index Onmessage Constants ************/
const MESSAGE_SAVE_SNAPSHOT = 'snapshot';
const MESSAGE_LAMMPS_DATA = 'lammps_data';
const MESSAGE_SNAPSHOT_DATA = 'snapshot_data';

/*************** Name Constants ************/
const NAME_GROUP_INTERACTION = 'group_interaction';
const NAME_SHAKE_HYDROGEN = 'shake_hydrogen';
const NAME_VIEWER_INTERACTION_TOOL = 'tool-interaction';

