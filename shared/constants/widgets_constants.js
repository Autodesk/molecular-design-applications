import keyMirror from 'keymirror';

const widgetsConstants = keyMirror({
  ENTER_EMAIL: null,
  LOAD: null,
  SELECTION: null,
  RUN_DOCKER_CONTAINER: null,
  RUN_DOCKER_CONTAINER_FAST: null,
  RUN_CWL: null,
  RESULTS: null, // automatically inserted on results page
});

export default widgetsConstants;
