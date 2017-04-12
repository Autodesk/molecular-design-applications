/*
We use Autodesk Molecule Viewer to display and navigate molecular data. Autodesk Molecule Viewer is not released under an open source license. For more information about the Autodesk Molecule Viewer license please refer to: https://molviewer.com/molviewer/docs/Pre-Release_Product_Testing_Agreement.pdf.
*/
import $ADSKMOLVIEW from 'tirrenu';
import interactiveSimConstants from '../constants/interactive_sim_constants';
import InteractionTool from './interactive_molecule_viewer_tools';

const MOL_VIEW_INITIALIZED = 'viewerInitialized';
const MOL_VIEW_MODEL_LOADED = 'Nano.ModelEndLoaded';
const MOL_VIEW_SELECTION_CHANGED_EVENT = 'selection';

class InteractiveMoleculeViewerWrapper {
  latestFrame = null
  isSimulating = false
  container = null
  moleculeViewer = null
  createPromise = null
  addModelPromise = null
  makeInteractivePromise = null

  constructor(container) {
    this.container = container;

    // Create the moleculeViewer
    const moleculeViewer = new $ADSKMOLVIEW(container, {
      headless: true,
    });
    this.moleculeViewer = moleculeViewer;

    // Can't do anything with moleculeViewer until this event fires
    this.createPromise = new Promise((resolve) => {
      const molViewInitialized = () => {
        if (this.moleculeViewer) {
          this.moleculeViewer.mv.removeEventListener(
            MOL_VIEW_INITIALIZED, molViewInitialized,
          );
        }

        // register interaction tool
        this.moleculeViewer.mv.toolController
          .registerTool(InteractionTool);
        resolve();
      };

      this.moleculeViewer.mv.addEventListener(
        MOL_VIEW_INITIALIZED, molViewInitialized,
      );
    });
  }

  /**
   * Destroy the viewer in the UI
   */
  destroy() {
    this.container.querySelector('.adsk-viewing-viewer').remove();
  }

  /**
   * Add the given model to the viewer
   * @param {String} modelData
   */
  addModel(modelData) {
    this.addModelPromise = new Promise((resolve) => {
      // Must wait for create and any previous addModel
      Promise.all([this.createPromise]).then(() => {
        const molViewModelLoaded = () => {
          if (this.moleculeViewer) {
            this.moleculeViewer.mv.removeEventListener(
              MOL_VIEW_MODEL_LOADED, molViewModelLoaded,
            );
          }
          resolve();
        };

        this.moleculeViewer.mv.addEventListener(
          MOL_VIEW_MODEL_LOADED, molViewModelLoaded,
        );
        this.moleculeViewer.createMoleculeFromData(modelData, 'pdb', true);
      });
    });
  }

  makeViewerInteractive() {
    this.addModelPromise.then(() => {
      // Models must be stick in order to animate
      const molViewModelSelected = () => {
        // ensure molecule is simulated
        if (this.latestFrame == null) {
          return;
        }

        const curSelection = this.moleculeViewer.getSelection();
        let selectedAtoms;
        Object.keys(curSelection).forEach((key, index) => {
          if (index === 0) {
            selectedAtoms = curSelection[key].atomID;
          }
        });

        // Set global variable so Status component
        // Knows that atoms were selected
        if (selectedAtoms && selectedAtoms.length > 0) {
          window.gAtomSelection = selectedAtoms;
        }
      };

      const pdbId = this.moleculeViewer.getModelID();
      this.moleculeViewer.setModelRepresentation(pdbId, 'ribbon', false);
      this.moleculeViewer.setModelRepresentation(pdbId, 'CPK', true);

      // add event listener
      this.moleculeViewer.mv.addEventListener(MOL_VIEW_SELECTION_CHANGED_EVENT,
        molViewModelSelected);

      // activate interaction tool
      this.moleculeViewer.mv.toolController.activateTool(
        interactiveSimConstants.NAME_VIEWER_INTERACTION_TOOL);
    });
  }

  drawArrows(selectedAtoms, vector) {
    if (!this.moleculeViewer || !vector || vector.length !== 3
      || !selectedAtoms || selectedAtoms.length <= 0) {
      return;
    }

    this.moleculeViewer.removeAllGeometries();

    const length = Math.sqrt(vector[0] * vector[0] +
      vector[1] * vector[1] + vector[2] * vector[2]);

    // Draw arrows
    let prevAtomIdx = -1;
    for (let j = 0; j < selectedAtoms.length; j++) {
      // identify number of GROUPS of atoms selected and draw arrow
      if (prevAtomIdx < 0 || Math.abs(selectedAtoms[j] - prevAtomIdx) > 1) {
        const posIndex = selectedAtoms[j] * 3;
        const posArray = this.latestFrame.positions;
        const origin = new window.THREE.Vector3(posArray[posIndex],
          posArray[posIndex + 1], posArray[posIndex + 2]);
        const dir = new window.THREE.Vector3(vector[0] / length,
          vector[1] / length, vector[2] / length);
        this.moleculeViewer.drawArrow(dir, origin, length, 0xf1c40f);
      }
      prevAtomIdx = selectedAtoms[j];
    }
  }

  /**
   * Apply animation to current model
   * @param {Array} posArray
   */
  applyAnimationWithPositions(posArray) {
    const frameArray = [];

    for (let i = 0; i < posArray.length; i++) {
      // Each object in posArray is a big string of all the atoms coordinates
      // Parse it to an array of strings
      // positions[0] - a string of a single atom's coordinates
      const positions = posArray[i].split('\n');
      const nthPos = [];

      for (let j = 0; j < positions.length; j++) {
        if (positions[j].length <= 0) {
          continue;
        }

        // Parse a string of x y z coordinates
        const xyz = positions[j].split(' ');
        nthPos.push(xyz[0]);
        nthPos.push(xyz[1]);
        nthPos.push(xyz[2]);
      }

      // Create frame object and add to the array
      const frame = {
        positions: new Float32Array(nthPos),
        bonds: this.moleculeViewer.getOriginalAnimState(
          this.moleculeViewer.getModelID()
        ).bonds,
      };
      frameArray.push(frame);
      this.latestFrame = frame;
    }

    // clear animation
    this.moleculeViewer.setPausedOn(false);
    this.moleculeViewer.clearAnimation();

    const id = this.moleculeViewer.getModelID();

    // loop through position array and add animation frame
    for (let i = 0; i < frameArray.length; i++) {
      this.moleculeViewer.addAnimationFrame(id, frameArray[i], true);
    }

    // Turn the actual animation
    this.isSimulating = true;
    this.moleculeViewer.setAnimateOn(true, 0.5);
    this.moleculeViewer.removeAllGeometries();
  }
}

export default InteractiveMoleculeViewerWrapper;
