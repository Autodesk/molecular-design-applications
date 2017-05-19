import axios from 'axios';
import { browserHistory } from 'react-router';
import { List as IList } from 'immutable';
import isEmail from 'validator/lib/isEmail';
import { widgetsConstants } from 'molecular-design-applications-shared';
import PipeDataRecord from './records/pipe_data_record';
import actionConstants from './constants/action_constants';
import apiUtils from './utils/api_utils';
import appUtils from './utils/app_utils';
import pipeUtils from './utils/pipe_utils';
import rcsbApiUtils from './utils/rcsb_api_utils';
import widgetUtils from './utils/widget_utils';

const FILE_INPUT_EXTENSIONS = ['pdb', 'xyz', 'sdf', 'mol2'];

export function initializeApp(appId) {
  return async function initializeAppDispatch(dispatch) {
    dispatch({
      type: actionConstants.INITIALIZE_APP,
      appId,
    });

    let app;
    try {
      app = await apiUtils.getApp(appId);

      if (app.comingSoon) {
        throw new Error('This app is not yet available, please try another.');
      }
    } catch (error) {
      console.error(error);
      return dispatch({
        type: actionConstants.FETCHED_APP,
        error,
      });
    }

    return dispatch({
      type: actionConstants.FETCHED_APP,
      app,
    });
  };
}

export function initializeRun(appId, runId) {
  return async function initializeRunDispatch(dispatch) {
    dispatch({
      type: actionConstants.INITIALIZE_APP,
      runId,
      appId,
    });

    let app;
    let run;
    try {
      app = await apiUtils.getApp(appId);
      run = await apiUtils.getRun(runId);
    } catch (error) {
      console.error(error);
      dispatch({
        type: actionConstants.FETCHED_RUN,
        error,
      });
      return;
    }

    app = app.set('run', run);

    dispatch({
      type: actionConstants.FETCHED_RUN,
      app,
    });

    try {
      let pipeDatasList = pipeUtils.flatten(app.run.pipeDatasByWidget);

      pipeDatasList = await appUtils.fetchPipeDataPdbs(pipeDatasList);
      pipeDatasList = await appUtils.fetchPipeDataJson(pipeDatasList);

      // If only one ligand, select it
      const ligands = pipeUtils.getLigandNames(pipeDatasList);
      if (ligands.size === 1) {
        pipeDatasList = pipeUtils.selectLigand(pipeDatasList, ligands.get(0));
      }

      const pipeDatasByWidget = pipeUtils.unflatten(pipeDatasList);
      const updatedRun = app.run.merge({ pipeDatasByWidget });

      // Find the widget that should be active for this run
      const activeWidgetIndex = widgetUtils.getActiveIndex(
        app.widgets, updatedRun.pipeDatasByWidget,
      );

      dispatch({
        type: actionConstants.FETCHED_RUN_IO,
        run: updatedRun,
        activeWidgetIndex,
      });
    } catch (error) {
      console.error(error);
      dispatch({
        type: actionConstants.FETCHED_RUN_IO,
        error: error ? (error.message || error) : null,
      });
    }
  };
}

export function clickWidget(widgetIndex) {
  return {
    type: actionConstants.CLICK_WIDGET,
    widgetIndex,
  };
}

/**
 * When the user clicks on the run button
 * @param {String} appId
 * @param {String} email
 * @param {IList of PipeDataRecords} inputPipeDatas
 * @param {String} [inputString]
 */
export function clickRun(appId, runId, email, pipeDatasByWidget, inputPipes, inputString) {
  return async function clickRunAsync(dispatch) {
    dispatch({
      type: actionConstants.CLICK_RUN,
    });

    const inputPipeDatas = inputPipes.map(inputPipe =>
      pipeUtils.get(pipeDatasByWidget, inputPipe),
    );

    try {
      await apiUtils.run(appId, email, inputPipeDatas, inputString); /* eslint no-unused-expressions: 'off', max-len: 'off' */

      // TODO this is fake data for now
      const data = {
        'final_structure.pdb': {
          pipeName: 'final_structure.pdb',
          type: 'url',
          value: 'https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb',
          widgetId: widgetsConstants.RUN,
        },
        'results.json': {
          pipeName: 'results.json',
          type: 'url',
          value: 'fakeurl',
          fetchedValue: {
            output_values: [
              { units: 'kcal/mol', name: 'Final energy', value: -6906.7908368173685 },
              { units: 'kcal/mol', name: 'Energy stabilization', value: -2256.7355290834971 },
              { units: 'ang', name: 'RMSD', value: 0.63453892906560627 },
            ],
            final_energy: { units: 'eV', value: -299.5067907721118 },
            initial_energy: { units: 'eV', value: -97.861312425186824 },
            rmsd: { units: 'ang', value: 0.63453892906560627 },
          },
          widgetId: widgetsConstants.RUN,
        },
        'minstep.0.pdb': {
          pipeName: 'minstep.0.pdb',
          type: 'url',
          value: 'https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb',
          widgetId: widgetsConstants.RUN,
        },
        'minstep.1.pdb': {
          pipeName: 'minstep.1.pdb',
          type: 'url',
          value: 'https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb',
          widgetId: widgetsConstants.RUN,
        },
        'minsteps.tar.gz': {
          pipeName: 'minsteps.tar.gz',
          type: 'url',
          value: 'https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb',
          widgetId: widgetsConstants.RUN,
        },
        'minstep_frames.json': {
          pipeName: 'minstep_frames.json',
          type: 'url',
          widgetId: widgetsConstants.RUN,
          value: 'fakeurl/minstep_frames.json',
          fetchedValue: ['minstep.0.pdb', 'minstep.1.pdb'],
        },
      };

      let pipeDatasList = new IList(Object.values(data).map(pipeDataData =>
        new PipeDataRecord(pipeDataData),
      ));

      pipeDatasList = await appUtils.fetchPipeDataPdbs(pipeDatasList);
      // TODO should also fetch json, but I'm hardcoding it for now
      // pipeDatasList = await appUtils.fetchPipeDataJson(pipeDatasList);

      let updatedPipeDatasByWidget = pipeDatasByWidget;
      pipeDatasList.forEach((pipeData) => {
        updatedPipeDatasByWidget = pipeUtils.set(
          updatedPipeDatasByWidget,
          pipeData,
        );
      });

      await apiUtils.updateSession(runId, updatedPipeDatasByWidget); /* eslint no-unused-expressions: 'off', max-len: 'off' */

      dispatch({
        type: actionConstants.RUN_SUBMITTED,
        pipeDatasByWidget: updatedPipeDatasByWidget,
      });
    } catch (err) {
      console.error(err);

      dispatch({
        type: actionConstants.RUN_SUBMITTED,
        err,
      });
    }
  };
}

export function selectInputFile(file, appId, runId, pipeDatasByWidget) {
  return async function selectInputFileDispatch(dispatch) {
    dispatch({
      type: actionConstants.INPUT_FILE,
      file,
    });

    const extension = file.name.split('.').pop();
    if (!FILE_INPUT_EXTENSIONS.includes(extension.toLowerCase())) {
      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        error: 'File has invalid extension.',
      });
      return;
    }

    try {
      const inputString = await appUtils.readFile(file);
      let inputPipeDatas = await appUtils.processInput(
        appId, inputString, extension,
      );

      // If only one ligand, select it
      const ligands = pipeUtils.getLigandNames(inputPipeDatas);
      if (ligands.size === 1) {
        inputPipeDatas = pipeUtils.selectLigand(inputPipeDatas, ligands.get(0));
      }

      let updatedPipeDatasByWidget = pipeDatasByWidget;
      inputPipeDatas.forEach((inputPipeData) => {
        updatedPipeDatasByWidget = pipeUtils.set(
          updatedPipeDatasByWidget,
          inputPipeData,
        );
      });

      await apiUtils.updateSession(runId, updatedPipeDatasByWidget); /* eslint no-unused-expressions: 'off', max-len: 'off' */

      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        inputPipeDatas,
      });
    } catch (err) {
      console.error(err);
      dispatch({
        type: actionConstants.INPUT_FILE_COMPLETE,
        error: err ? (err.message || err) : null,
        inputs: err ? err.inputs : null,
      });
    }
  };
}

export function submitInputString(inputString, appId, runId, pipeDatasByWidget) {
  return async function submitInputStringDispatch(dispatch) {
    dispatch({
      type: actionConstants.SUBMIT_INPUT_STRING,
      inputString,
    });

    // If the input is 4 characters, try it as a pdbid first
    let pdbDownload;
    if (inputString.length === 4) {
      try {
        pdbDownload = await rcsbApiUtils.getPdbById(inputString);
      } catch (error) {
        console.log(`Failed to fetch ${inputString} as pdbid, will try directly.`);
      }
    }

    try {
      const newInput = pdbDownload ? pdbDownload.pdb : inputString;
      const extension = pdbDownload ? '.pdb' : '';
      let inputPipeDatas = await appUtils.processInput(
        appId, newInput, extension,
      );

      // If only one ligand, select it
      const ligands = pipeUtils.getLigandNames(inputPipeDatas);
      if (ligands.size === 1) {
        inputPipeDatas = pipeUtils.selectLigand(inputPipeDatas, ligands.get(0));
      }

      let updatedPipeDatasByWidget = pipeDatasByWidget;
      inputPipeDatas.forEach((inputPipeData) => {
        updatedPipeDatasByWidget = pipeUtils.set(
          updatedPipeDatasByWidget,
          inputPipeData,
        );
      });

      await apiUtils.updateSession(runId, updatedPipeDatasByWidget); /* eslint no-unused-expressions: 'off', max-len: 'off' */

      dispatch({
        type: actionConstants.PROCESSED_INPUT_STRING,
        updatedPipeDatasByWidget,
      });
    } catch (err) {
      console.error(err);
      dispatch({
        type: actionConstants.PROCESSED_INPUT_STRING,
        error: err.message || err,
        inputPipeDatas: err ? err.inputPipeDatas : null,
      });
    }
  };
}

export function submitEmail(email, appId, runId, pipeDatasByWidget) {
  return async function submitEmailDispatch(dispatch) {
    if (!isEmail(email)) {
      dispatch({
        type: actionConstants.SUBMIT_EMAIL,
        error: 'Invalid email',
      });
    }

    const updatedPipeDatasByWidget = pipeUtils.set(
      pipeDatasByWidget,
      new PipeDataRecord({
        pipeName: 'email',
        type: 'inline',
        value: email,
        widgetId: widgetsConstants.ENTER_EMAIL,
      }),
    );

    dispatch({
      type: actionConstants.SUBMIT_EMAIL,
      updatedPipeDatasByWidget,
    });

    if (runId) {
      // TODO update email in session
      return;
    }

    let createdRunId;
    try {
      createdRunId = await apiUtils.startSession(email, appId);

      await apiUtils.updateSession(createdRunId, updatedPipeDatasByWidget); /* eslint no-unused-expressions: 'off', max-len: 'off' */
    } catch (error) {
      console.error(error);
      dispatch({
        type: actionConstants.START_SESSION,
        error,
        clearedPipeDatas: pipeDatasByWidget,
      });
    }

    dispatch({
      type: actionConstants.START_SESSION,
      runId: createdRunId,
    });

    browserHistory.push(`/app/${appId}/${createdRunId}`);
  };
}

export function clickAbout() {
  return {
    type: actionConstants.CLICK_ABOUT,
  };
}

export function clickCancel(runId) {
  return (dispatch) => {
    dispatch({
      type: actionConstants.CLICK_CANCEL,
    });

    apiUtils.cancelRun(runId).then(() => {
      dispatch({
        type: actionConstants.SUBMITTED_CANCEL,
      });
    }).catch((err) => {
      dispatch({
        type: actionConstants.SUBMITTED_CANCEL,
        err,
      });
    });
  };
}

export function messageTimeout() {
  return {
    type: actionConstants.MESSAGE_TIMEOUT,
  };
}

export function clickColorize() {
  return {
    type: actionConstants.CLICK_COLORIZE,
  };
}

export function changeLigandSelection(pipeDatas, ligand) {
  const updatedPipeDatas = pipeUtils.selectLigand(pipeDatas, ligand);
  const updatedPipeDatasByWidget = pipeUtils.unflatten(updatedPipeDatas);
  return {
    type: actionConstants.CHANGE_LIGAND_SELECTION,
    pipeDatasByWidget: updatedPipeDatasByWidget,
  };
}

export function changeMorph(morph) {
  return {
    type: actionConstants.CHANGE_MORPH,
    morph,
  };
}

export function runCCCTurbo(sessionId, widgetId, cccTurboBlob) {
  return (dispatch) => {
    dispatch({
      type: actionConstants.CCC_RUN_TURBO_SUBMITTED,
      sessionId,
      widgetId,
    });

    const API_URL = process.env.API_URL || '';

    axios.post(`${API_URL}/v1/ccc/run/turbo`, cccTurboBlob)
      .then((result) => {
        console.log(result);
        //TODO: pipe data back into the state
        //don't forget to check errors
      })
      .catch((err) => {
        console.error(err);
        dispatch({
          type: actionConstants.CCC_RUN_TURBO_ERROR,
          sessionId,
          widgetId,
          error: err
        });
      });
  };
}

export function runCCC(sessionId, widgetId, cccBlob) {
  return (dispatch) => {
    dispatch({
      type: actionConstants.CCC_RUN_SUBMITTED,
      sessionId,
      widgetId,
    });

    const API_URL = process.env.API_URL || '';

    axios.post(`${API_URL}/v1/ccc/run`, cccTurboBlob)
      .then((result) => {
        console.log(result);
        //TODO: pipe data back into the state
        //don't forget to check errors
      })
      .catch((err) => {
        console.error(err);
        dispatch({
          type: actionConstants.CCC_RUN_ERROR,
          sessionId,
          widgetId,
          error: err
        });
      });
  };
}
