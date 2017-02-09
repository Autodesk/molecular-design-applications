import { Record, List as IList } from 'immutable';
import RunRecord from './run_record';

const WorkflowRecord = new Record({
  bgColor: '',
  bgIndex: null,
  color: null,
  comingSoon: false,
  creatorImage: null,
  id: null,
  fetching: false, // for fetching the workflow itself
  fetchingError: null,
  selectLigands: false,
  run: new RunRecord(),
  runCount: 0,
  title: '',
  viewCount: 0,
  workflowNodes: new IList(),
});

export default WorkflowRecord;
