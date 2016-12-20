import { Record } from 'immutable';
import statusConstants from '../../../../shared/status_constants';

const WorkflowNodeRecord = new Record({
  id: null,
  node: null,
  status: statusConstants.IDLE,
  modelData: null,
  fetchingPDB: false,
  fetchingPDBError: null,
  outputs: [],
});

export default WorkflowNodeRecord;
