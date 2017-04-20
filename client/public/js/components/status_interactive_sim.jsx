
import React from 'react';
import interactiveSimConstants from '../constants/interactive_sim_constants';

// TODO: the path is causing eslint error
// eslint-disable-next-line
const MyWorker = require('worker-loader!../interactive_sim/worker.js');

require('../../css/status_interactive_sim.scss');

class StatusInteractiveSim extends React.Component {

  constructor(props) {
    super(props);
    this.lammpsWorker = new MyWorker();
    this.lammpsData = props.lammpsData;

    this.state = {
      /* Temporary Values */
      tmpStartTemp: 300.0,
      tmpEndTemp: 300.0,
      tmpDampTemp: 100.0,
      tmpTimestep: 1.0,
      tmpDuration: 50,

      recenterMolecule: true,
      shakeHydrogen: false,
      interactionMode: 'pull',

      energy: NaN,
      performance: NaN,
    };

    this.startTemp = 300.0;
    this.endTemp = 300.0;
    this.dampTemp = 100.0;

    this.timestep = 1.0;
    this.duration = 50;

    this.ready = false;
    this.isRunning = false;

    // Global variables for simulation
    window.gInteractionMode = this.state.interactionMode;
    window.gIsInteracting = false;
    window.gVector = undefined;
    window.gAtomSelection = undefined;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.changeInteractionMode = this.changeInteractionMode.bind(this);
    this.updateSimulationSettings = this.updateSimulationSettings.bind(this);

    this.fireSimulation = this.fireSimulation.bind(this);
    this.playSimulation = this.playSimulation.bind(this);

    this.respondToWorker = this.respondToWorker.bind(this);
  }

  componentWillMount() {
    this.lammpsWorker.onmessage = this.respondToWorker;
  }

  componentWillUnmount() {
    this.playSimulation(false);
    // Destroy lammps object and terminates web worker thread
    this.lammpsWorker.postMessage([interactiveSimConstants
      .MESSAGE_WORKER_TERMINATE]);
  }

  // Used for updating simulation settings.
  // This additional step is required so that changing the values during
  // simulation doesn't mess up the simulation
  updateSimulationSettings() {
    /* Assign temporary values to actual values */
    this.timestep = this.state.tmpTimestep;
    this.endTemp = this.state.tmpEndTemp;
    this.dampTemp = this.state.tmpDampTemp;
    this.startTemp = this.state.tmpStartTemp;

    // update duration and output frequency
    this.duration = this.state.tmpDuration;
  }

  fireSimulation() {
    // ensure simulation isn't paused
    if (!this.ready) {
      return;
    }
    if (!this.isRunning) {
      return;
    }

    // clear settings for system
    this.lammpsWorker.postMessage([interactiveSimConstants.MESSAGE_CLEAR_SYSTEM]);

    // Check user settings for timestemp
    this.lammpsWorker.postMessage(`timestep ${this.timestep}`);

    if (window.gIsInteracting && window.gAtomSelection
      && window.gVector && window.gAtomSelection.length > 0) {
      // Group selected atoms together
      this.lammpsWorker.postMessage([interactiveSimConstants.MESSAGE_GROUP_ATOMS,
        [interactiveSimConstants.NAME_GROUP_INTERACTION, window.gAtomSelection]]);

      // if drag, displace atoms and don't run dynamics
      if (window.gInteractionMode === 'drag') {
        this.lammpsWorker.postMessage([interactiveSimConstants
          .MESSAGE_DRAG_MOLECULE, window.gVector]);
        this.lammpsWorker.postMessage([interactiveSimConstants
          .MESSAGE_RUN_MINIMIZATION, 10]);

        // drag is ONE TIME interaction
        window.gIsInteracting = false;
        return;
      }	else if (window.gInteractionMode === 'pull') {
        this.lammpsWorker.postMessage([interactiveSimConstants
          .MESSAGE_PULL_MOLECULE, window.gVector]);
        // Don't return since pull is still dynamics
      }
    }
    const newTemp = [this.startTemp, this.endTemp, this.dampTemp];
    this.lammpsWorker.postMessage([interactiveSimConstants.MESSAGE_LANGEVIN,
      newTemp]);

    // recenter
    this.lammpsWorker.postMessage([interactiveSimConstants
      .MESSAGE_FIX_RECENTER, this.state.recenterMolecule]);

    // shake hydrogen
    if (this.state.shakeHydrogen) {
      this.lammpsWorker.postMessage([interactiveSimConstants
        .MESSAGE_FIX_SHAKE, [interactiveSimConstants.NAME_SHAKE_HYDROGEN, '1.0']]);
    }

    // Run dynamics
    this.lammpsWorker.postMessage([interactiveSimConstants
      .MESSAGE_RUN_DYNAMICS, [this.duration, this.duration]]);
  }

  respondToWorker(e) {
    const messageName = e.data[0];

    switch (messageName) {
      case interactiveSimConstants.MESSAGE_WORKER_READY: {
        // Create lammps system with provided data
        this.lammpsWorker.postMessage([interactiveSimConstants
          .MESSAGE_LAMMPS_DATA, this.lammpsData]);
        break;
      }

      case interactiveSimConstants.MESSAGE_LAMMPS_DATA:
      case interactiveSimConstants.MESSAGE_SNAPSHOT_DATA: {
        const success = e.data[1];

        // If system was successfully created, fire simulation
        if (success) {
          // Set simulation as ready
          this.ready = true;
          this.playSimulation(true);
        }
        break;
      }

      case interactiveSimConstants.MESSAGE_ENERGY_DATA: {
        const energyVal = e.data[1];
        this.setState({ ['energy']: energyVal });
        break;
      }

      case interactiveSimConstants.MESSAGE_POSITION_DATA: {
        // update interactive moleculeviewer with new positions
        const positionArray = e.data[1];
        window.updateInteractiveMV(positionArray);

        // Continue  simulation
        this.fireSimulation();
        break;
      }

      case interactiveSimConstants.MESSAGE_PERFORMANCE: {
        const performVal = e.data[1];
        this.setState({ ['performance']: performVal });
        break;
      }

      case interactiveSimConstants.MESSAGE_ERROR: {
        // Reset simulation
        this.gTimestep = 1.0;
        this.setState({ ['tmpTimestep']: 1.0 });

        // Set shake to false
        this.setState({ ['shakeHydrogen']: false });

        // Reset global variables
        window.gVector = undefined;
        window.gAtomSelection = undefined;
        window.gIsInteracting = false;

        // Recreate system
        this.lammpsWorker.postMessage([interactiveSimConstants
          .MESSAGE_LAMMPS_DATA, this.lammpsData]);

        break;
      }

      default:
        break;
    }
  }

  // Handle input changes of NON-GLOBAL variables
  handleInputChange(event) {
    const target = event.target;
    let newValue = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (target.type === 'number') {
      newValue = Number(newValue);
    }

    // Set state for simulation settings
    this.setState({
      [name]: newValue,
    });
  }

  // Handle input changes of GLOBAL interaction mode variable
  changeInteractionMode(event) {
    const target = event.target;
    const name = target.name;

    this.setState({
      [name]: target.value,
    });

    // Need to expose this to other components (i.e. viewer)
    window.gInteractionMode = target.value;
  }

  // Toggle Simulation when press play or pause
  playSimulation(value) {
    // Don't toggle simulation if not ready
    if (!this.ready) {
      return;
    }

    // If toggle value was given, set it to that value
    if (typeof value === 'boolean') {
      this.isRunning = value;
    } else {
      this.isRunning = !this.isRunning;
    }

    // Reset button text
    const buttonLabel = document.getElementById('TextTogglePlay');
    if (this.isRunning) {
      buttonLabel.innerHTML = 'PAUSE';
    } else {
      buttonLabel.innerHTML = 'PLAY';
    }

    this.fireSimulation();
  }

  render() {
    return (
      <div className="status-info status-interactive-sim">
        <button
          title="Toggle Simulation"
          className="button form setting-block"
          onClick={this.playSimulation}
        >
          <div id="TextTogglePlay">PLAY</div>
        </button>
        <div className="input">
          <label className="bodyFont">
            Energy (kcal / mol):
            <input
              name="energy"
              type="number"
              readOnly
              value={this.state.energy}
              onChange={this.handleInputChange}
            />
          </label>
        </div>
        <div className="input setting-block">
          <label className="bodyFont">
            Performance (frames / sec):
            <input
              name="performance"
              readOnly
              type="number"
              value={this.state.performance}
              onChange={this.handleInputChange}
            />
          </label>
        </div>
        <div className="sectionDivider"></div>
        <div className="input">
          <label className="bodyFont">
            Timestep (fs):
            <input
              name="tmpTimestep"
              type="number"
              placeholder="Enter timestep"
              value={this.state.tmpTimestep}
              onChange={this.handleInputChange}
            />
          </label>
        </div>
        <div className="input">
          <label className="bodyFont">
            Duration (# of cycles):
            <input
              name="tmpDuration"
              type="number"
              placeholder="Enter duration"
              value={this.state.tmpDuration}
              onChange={this.handleInputChange}
            />
          </label>
        </div>
        <div className="input">
          <label className="bodyFont">
            Start Temperature (Kelvin):
            <input
              name="tmpStartTemp"
              type="number"
              placeholder="Start temperature"
              value={this.state.tmpStartTemp}
              onChange={this.handleInputChange}
            />
          </label>
        </div>
        <div className="input">
          <label className="bodyFont">
            End Temperature (Kelvin):
            <input
              name="tmpEndTemp"
              type="number"
              placeholder="End temperature"
              value={this.state.tmpEndTemp}
              onChange={this.handleInputChange}
            />
          </label>
        </div>
        <div className="input">
          <label className="bodyFont">
            Damp Temperature (Kelvin):
            <input
              name="tmpDampTemp"
              type="number"
              placeholder="Damp temperature"
              value={this.state.tmpDampTemp}
              onChange={this.handleInputChange}
            />
          </label>
        </div>
        <button
          title="Apply above simulation settings"
          className="button form setting-block"
          type="button"
          onClick={this.updateSimulationSettings}
        >
          Apply Setting
        </button>
        <div className="sectionDivider"></div>
        <div className="radio">
          <label>
            <input
              name="interactionMode"
              value="pull"
              type="radio"
              checked={this.state.interactionMode === 'pull'}
              onChange={this.changeInteractionMode}
            />
            <div className="bodyFont">Pull</div>
          </label>
        </div>
        <div className="radio-inline setting-block">
          <label>
            <input
              name="interactionMode"
              value="drag"
              type="radio"
              checked={this.state.interactionMode === 'drag'}
              onChange={this.changeInteractionMode}
            />
            <div className="bodyFont">Drag</div>
          </label>
        </div>
        <div className="sectionDivider"></div>
        <div className="checkbox">
          <label>
            <input
              name="recenterMolecule"
              type="checkbox"
              checked={this.state.recenterMolecule}
              onChange={this.handleInputChange}
              value="recenter"
            />
            <div className="bodyFont">Recenter</div>
          </label>
        </div>
        <div className="checkbox setting-block">
          <label>
            <input
              name="shakeHydrogen"
              type="checkbox"
              checked={this.state.shakeHydrogen}
              onChange={this.handleInputChange}
            />
            <div className="bodyFont">Shake Hydrogen</div>
          </label>
        </div>
      </div>
    );
  }
}


StatusInteractiveSim.propTypes = {
  lammpsData: React.PropTypes.string.isRequired,
};

export default StatusInteractiveSim;
