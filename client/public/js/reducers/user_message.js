import actionConstants from '../constants/action_constants';
import UserMessageRecord from '../records/user_message_record';

const initialState = new UserMessageRecord();

function userMessage(state = initialState, action) {
  switch (action.type) {
    case actionConstants.FETCHED_WORKFLOW:
      if (!action.error) {
        return state;
      }
      // A 404 error will be displayed elsewhere
      if (action.error.response && action.error.response.status === 404) {
        return state;
      }
      return state.merge({
        autoClose: false,
        message: `We're having trouble connecting. Are you connected to the
          internet?`,
      });

    case actionConstants.FETCHED_RUN:
      if (!action.error) {
        return state;
      }
      // A 404 error will be displayed elsewhere
      if (action.error.response && action.error.response.status === 404) {
        return state;
      }
      return state.merge({
        autoClose: false,
        message: `We're having trouble connecting. Are you connected to the
          internet?`,
      });

    case actionConstants.SUBMITTED_CANCEL:
      if (!action.err) {
        return initialState;
      }
      return state.merge({
        autoClose: true,
        message: 'Failed to cancel, check your connection and try again.',
      });

    case actionConstants.FETCHED_PDB_BY_ID:
      if (!action.err) {
        return initialState;
      }
      return state.merge({
        autoClose: true,
        message: 'Couldn\'t find a pdb with that id, please try again.',
      });

    case actionConstants.MESSAGE_TIMEOUT:
      return initialState;

    case actionConstants.RUN_SUBMITTED:
      if (!action.err) {
        return state;
      }

      return state.merge({
        autoClose: true,
        message: 'Failed to submit run, check your connection and try again.',
      });

    default:
      return state;
  }
}

export default userMessage;
