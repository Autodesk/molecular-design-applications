import { Record } from 'immutable';
import { statusConstants } from 'molecular-design-applications-shared';

const WorkflowNodeRecord = new Record({
  id: null,
  node: null,
  status: statusConstants.IDLE,
  modelData: null,
  outputs: [],
});

export default WorkflowNodeRecord;
