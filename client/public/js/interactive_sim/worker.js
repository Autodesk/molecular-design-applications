import interactiveSimConstants from '../constants/interactive_sim_constants';

const LAMMPS_DEBUG = false;

function setUpModule() {
  // Set up Module variable
  self.Module = {
    preRun: [],
    print(text) {
      if (LAMMPS_DEBUG) {
        console.log(text);
      }
      return;
    },
    postRun() {
      console.log('Finished Running Main');
      postMessage([interactiveSimConstants.MESSAGE_WORKER_READY, true]);
    },
  };
  if (typeof self.importScripts === 'function') {
    // try wasm
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/interactive_sim/emscripten.wasm', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function () {
      self.Module.wasmBinary = xhr.response;
      (function () {
        console.log('WORKER: importing emscripten.js');

        let memoryInitializer = '/interactive_sim/emscripten.js.mem';
        if (typeof self.Module.locateFile === 'function') {
          memoryInitializer = self.Module.locateFile(memoryInitializer);
        } else if (self.Module.memoryInitializerPrefixURL) {
          memoryInitializer = self.Module.memoryInitializerPrefixURL + memoryInitializer;
        }
        const memXhr = self.Module.memoryInitializerRequest = new XMLHttpRequest();
        memXhr.open('GET', memoryInitializer, true);
        memXhr.responseType = 'arraybuffer';
        memXhr.send(null);
      }());

      self.importScripts('/interactive_sim/emscripten.js');
    };
    xhr.send(null);
  }
}


// LAMMPS Variables
const NAME_FIX_NVE = 'fix_nve';
const NAME_FIX_ADDFORCE = 'fix_addforce';
const NAME_FIX_RECENTER = 'fix_recenter';
const NAME_FIX_LANGEVIN = 'fix_langevin';

self.lmpsForWeb = null;

setUpModule();

// functions
// get total energy from dump file of each atom's energy
function getTotalEnergy(energyDataString) {
  const energyPerAtom = energyDataString.split('\n');
  // loop through position array and add animation frame

  let totalEnergy = 0;
  for (let i = 0; i < energyPerAtom.length; i++) {
    const atomEnergy = parseFloat(energyPerAtom[i]);
    if (!isNaN(atomEnergy)) {
      totalEnergy += atomEnergy;
    }
  }
  return totalEnergy;
}

function setUpAsCharmm() {
  if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
    return;
  }
  self.lmpsForWeb.execute_cmd('units real');
  self.lmpsForWeb.execute_cmd('dimension 3');
  self.lmpsForWeb.execute_cmd('atom_style full');
  self.lmpsForWeb.execute_cmd('pair_style lj/charmm/coul/charmm/implicit 8.0 10.0');
  self.lmpsForWeb.execute_cmd('bond_style harmonic');
  self.lmpsForWeb.execute_cmd('angle_style harmonic');
  self.lmpsForWeb.execute_cmd('dihedral_style harmonic');
  self.lmpsForWeb.execute_cmd('improper_style harmonic');
}

// Web Worker Callback
self.onmessage = function (e) {
  // Message array for posting message back to the main thread
  /** @type {string} message[0]  **/
  /** @type {...} message[1]  **/
  const message = [];
  const taskName = e.data[0];

  switch (taskName) {
    case interactiveSimConstants.MESSAGE_WORKER_TERMINATE: {
      if (self.lmpsForWeb) {
        console.log('WORKER: About to terminate worker');
        self.lmpsForWeb.delete();
        self.lmpsForWeb = null;
        self.close();
      }
      break;
    }

    case interactiveSimConstants.MESSAGE_LAMMPS_DATA:
    case interactiveSimConstants.MESSAGE_SNAPSHOT_DATA: {
      if (e.data.length !== 2) {
        break;
      }

      let dirPath;
      try {
        dirPath = self.Module.get_dir_path();
      } catch (err) {
        console.log('WORKER: Could not get directory path');
        break;
      }

      // Prepare message back to main thread
      message.length = 0;
      message.push(e.data[0]);

      // delete old system
      if (self.lmpsForWeb && self.lmpsForWeb !== undefined) {
        self.lmpsForWeb.delete();
        self.lmpsForWeb = null;
      }

      // Create system ID
      const d = new Date();
      const id = d.getTime() % 111111;

      // Create lammps web object
      try {
        self.lmpsForWeb = new self.Module.Lammps_Web(id);
      } catch (err) {
        self.lmpsForWeb.delete();
        self.lmpsForWeb = null;
        setUpModule();
        break;
      }

      if (taskName === interactiveSimConstants.MESSAGE_LAMMPS_DATA) {
        // If Lammps data, set up as CHARMM
        setUpAsCharmm();

        const molData = e.data[1];
        const dataFileName = `${id}.data`;
        self.FS.createDataFile(dirPath, dataFileName, molData, true, true);
        const readDataCmd = `read_data ${dirPath}${dataFileName}`;
        self.lmpsForWeb.execute_cmd(readDataCmd);
      } else {
        const dataFileName = e.data[1];
        const readRestartCmd = `read_restart ${dirPath}${dataFileName}`;
        self.lmpsForWeb.execute_cmd(readRestartCmd);
      }

      // Finish setting up system
      self.lmpsForWeb.execute_cmd('neighbor 2.0 bin');
      self.lmpsForWeb.execute_cmd('neigh_modify delay 5');
      self.lmpsForWeb.execute_cmd('timestep 1');
      self.lmpsForWeb.execute_cmd('dielectric 4.0');

      // Send message back to main thread
      message.push(true);
      postMessage(message);
      break;
    }

    case interactiveSimConstants.MESSAGE_SAVE_SNAPSHOT: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      const saveFileName = e.data[1];
      if (!saveFileName || saveFileName === undefined) {
        break;
      }

      // Save snapshot at that file name - directory name not necessary
      // Since everything will be saved @ the same directory as
      // self.Module.get_dir_path()
      self.lmpsForWeb.save_snapshot(saveFileName);

      // Send message back to main thread
      message.length = 0;
      message.push(taskName);
      message.push(saveFileName);
      postMessage(message);
      break;
    }

    case interactiveSimConstants.MESSAGE_CLEAR_SYSTEM: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      // Clear system by removing all fix
      self.lmpsForWeb.check_and_refresh();
      self.lmpsForWeb.remove_all_fix();
      break;
    }

    case interactiveSimConstants.MESSAGE_GROUP_ATOMS: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      // Get group settings - [String, Array{Number}]
      const groupSettings = e.data[1];
      if (groupSettings.length !== 2) {
        break;
      }
      const groupName = groupSettings[0];
      const atomIndices = groupSettings[1];

      let atomIdsString = '';
      for (let i = 0; i < atomIndices.length; i++) {
        const atomId = atomIndices[i] + 1;
        atomIdsString += `${atomId} `;
      }

      // If group with same name already exists, clear it
      if (self.lmpsForWeb.does_group_exist(groupName)) {
        self.lmpsForWeb.execute_cmd(`group ${groupName} clear`);
      }

      // Group the atoms
      const groupCmd = `group ${groupName} id ${atomIdsString.trim()}`;
      self.lmpsForWeb.execute_cmd(groupCmd);
      break;
    }

    case interactiveSimConstants.MESSAGE_LANGEVIN: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      const langeTemp = e.data[1];
      if (!langeTemp || langeTemp.length !== 3) {
        break;
      }

      // apply nve
      const nveFixCmd = `fix ${NAME_FIX_NVE} all nve`;
      self.lmpsForWeb.execute_cmd(nveFixCmd);

      // apply langevin with specified temperature
      const langevinFixCmd = `fix ${NAME_FIX_LANGEVIN} all langevin 
      ${langeTemp[0]} ${langeTemp[1]} ${langeTemp[2]} 48279`;
      self.lmpsForWeb.execute_cmd(langevinFixCmd);
      break;
    }

    case interactiveSimConstants.MESSAGE_FIX_SHAKE: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      // Get shake settings - [String, String]
      const shakeSettings = e.data[1];
      if (!shakeSettings || shakeSettings === undefined ||
        shakeSettings.length !== 2) {
        break;
      }

      const shakeName = shakeSettings[0];	// shake ID
      const massStringValue = shakeSettings[1];	// masses of elements to shake

      // Ensure mass string value is provided
      if (massStringValue && massStringValue !== undefined) {
        const shakeCmd = `fix ${shakeName} all shake 0.0001 20 0 m 
        ${massStringValue}`;
        self.lmpsForWeb.execute_cmd(shakeCmd);
      }
      break;
    }

    case interactiveSimConstants.MESSAGE_FIX_RECENTER: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      // Check if recenter is true or false
      const recenter = e.data[1];
      if (recenter) {
        const recenterCmd = `fix ${NAME_FIX_RECENTER} all recenter INIT INIT INIT`;
        self.lmpsForWeb.execute_cmd(recenterCmd);
      } else if (self.lmpsForWeb.does_fix_exist(NAME_FIX_RECENTER)) {
        self.lmpsForWeb.execute_cmd(`unfix ${NAME_FIX_RECENTER}`);
      }
      break;
    }

    case interactiveSimConstants.MESSAGE_RUN_DYNAMICS: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      // Get simulation settings - [Number, Number]
      const simSettings = e.data[1];

      // time before simulation
      const startTime = new Date().getTime();

      try {
        const totIter = simSettings[0];
        const outputFreq = simSettings[1];

        // run dynamics
        const runNum = self.lmpsForWeb.run_dynamics(totIter, outputFreq);

        // Get simulation data
        const endTime = new Date().getTime();
        const time = (endTime - startTime) / 1000;
        const framesPerSec = Math.floor(totIter / outputFreq) / time;

        const dataString = self.lmpsForWeb.get_energy(runNum);
        const energy = getTotalEnergy(dataString);

        const posArray = self.lmpsForWeb.get_frames(runNum);

        // Send energy data to main thread
        message.length = 0;
        message.push(interactiveSimConstants.MESSAGE_ENERGY_DATA);
        message.push(energy);
        postMessage(message);

        // Send performance data to main thread
        message.length = 0;
        message.push(interactiveSimConstants.MESSAGE_PERFORMANCE);
        message.push(framesPerSec);
        postMessage(message);

        // Send position data to main thread
        message.length = 0;
        message.push(interactiveSimConstants.MESSAGE_POSITION_DATA);
        message.push(posArray);
        postMessage(message);
      } catch (err) {
        self.lmpsForWeb.delete();
        self.lmpsForWeb = null;

        // Send error message to main thread
        console.log('WORKER: Unstable Simulation');
        message.length = 0;
        message.push(interactiveSimConstants.MESSAGE_ERROR);
        postMessage(message);
      }
      break;
    }

    case interactiveSimConstants.MESSAGE_DRAG_MOLECULE: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      // Get displacement vector - [Number, Number, Number]
      const vector = e.data[1];
      if (!vector || vector.length !== 3 ||
        !self.lmpsForWeb.does_group_exist(interactiveSimConstants.NAME_GROUP_INTERACTION)) {
        break;
      }

      try {
      // Displace atoms
        const displaceCmd = `displace_atoms ${interactiveSimConstants
        .NAME_GROUP_INTERACTION} move ${vector[0]} ${vector[1]} ${vector[2]}`;
        self.lmpsForWeb.execute_cmd(displaceCmd);
      } catch (err) {
        self.lmpsForWeb.delete();
        self.lmpsForWeb = null;

        console.log('WORKER: Unstable Simulation');
        message.length = 0;
        message.push(interactiveSimConstants.MESSAGE_ERROR);
        postMessage(message);
      }
      break;
    }

    case interactiveSimConstants.MESSAGE_PULL_MOLECULE: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      // Get force vector - [Number, Number, Number]
      const addForceVector = e.data[1];

      // If force vector isn't specified or interaction group does not exist, don't add the fix
      if (addForceVector && addForceVector.length === 3) {
        const addForceCmd = `fix ${NAME_FIX_ADDFORCE} ${interactiveSimConstants
        .NAME_GROUP_INTERACTION} addforce ${addForceVector[0]} 
        ${addForceVector[1]} ${addForceVector[2]}`;
        self.lmpsForWeb.execute_cmd(addForceCmd);
      }
      break;
    }

    case interactiveSimConstants.MESSAGE_RUN_MINIMIZATION: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      const outputFreq = e.data[1];
      if (outputFreq <= 0) {
        break;
      }

      try {
        const runNum = self.lmpsForWeb.minimize(outputFreq);
        const posArray = self.lmpsForWeb.get_frames(runNum);

        // Send position data to the main thread
        message.length = 0;
        message.push(interactiveSimConstants.MESSAGE_POSITION_DATA);
        message.push(posArray);
        postMessage(message);
      } catch (err) {
        self.lmpsForWeb.delete();
        self.lmpsForWeb = null;

        // Send error message to the main thread
        console.log('WORKER: Unstable Simulation');
        message.length = 0;
        message.push(interactiveSimConstants.MESSAGE_ERROR);
        postMessage(message);
      }
      break;
    }

    case interactiveSimConstants.MESSAGE_REMOVE_FILE: {
      const fileName = e.data[1];
      if (fileName && fileName !== undefined) {
        try {
          const dirPath = self.Module.get_dir_path();
          const filePath = dirPath + fileName;
          self.FS.unlink(filePath);
        } catch (err) {
          break;
        }
      }
      break;
    }

    default: {
      if (!self.lmpsForWeb || self.lmpsForWeb === undefined) {
        break;
      }

      const command = e.data;

      try {
        self.lmpsForWeb.execute_cmd(command);
      } catch (err) {
        self.lmpsForWeb.delete();
        self.lmpsForWeb = null;

        // Send error message to the main thread
        console.log('WORKER: Improper LAMMPS command');
        message.length = 0;
        message.push(interactiveSimConstants.MESSAGE_ERROR);
        postMessage(message);
      }
      break;
    }
  }
};

