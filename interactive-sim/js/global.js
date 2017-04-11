window.gLammpsWorker;	// Worker for Lammps_Web 

window.gStartTemp;	// Starting temperature for NVT
window.gEndTemp;	// End temperature for NVT
window.gDampTemp;	// Damping temperature for NVT

window.gRecenter;	// Recenter option for Dynamics
window.gShakeHydrogen;	// Fix hydrogen atoms

window.gTimestep;	// Timestep for Dynamics 
window.gDuration;	// Duration (how many timesteps) for Dynamics 
window.gOutputFreq;	// Output frequency of dump files

window.gIsInteracting;	// current state of interaction: undefined, 'drag', or 'pull'
window.gVector;		// vector associated with interaction
window.gAtomSelection;	// array of selected atom indices

window.gIsRunning;	// current status of simulation

window.gReady;

// initialize global variable
function initGlobalVar() {

        gLammpsWorker = null;    // Worker for Lammps_Web

        gStartTemp = 300.0;      // Starting temperature for NVT
        gEndTemp = 300.0;        // End temperature for NVT
        gDampTemp = 100.0;       // Damping temperature for NVT

	gRecenter = true;
	gShakeHydrogen = false;

        gTimestep = 1.0;         // Timestep for NVT
        gDuration = 50;          // Duration (how many timesteps) for NVT
        gOutputFreq = 50;        // Output frequency of NVT dump files

        gIsInteracting = undefined;  // current state of interaction
        gVector = undefined;          // vector associated with interaction
        gAtomSelection = undefined;   // array of selected atom indices

	gIsRunning = false;
	gReady = false;
}

// validate input
function validateInput(input) {
	let isValid = true;
	if(input == null || input == undefined || isNaN(input)) {
		isValid = false;
	}
	return isValid;
}

// Play or Pause simulation 
function togglePlay(doPlay) {
	if (doPlay == null || doPlay == undefined)
		gIsRunning = !gIsRunning;
	else
		gIsRunning = doPlay;

	document.getElementById('BtnToggleSimulation').firstElementChild.className = (gIsRunning ? "fa fa-pause" : "fa fa-play");
	document.getElementById('BtnToggleSimulation').className = 'btn btn-info';

	fireSimulation();
}


// Attemp to run simulation
function fireSimulation()
{
	// ensure simulation isn't paused
	if (!gReady)
		return;

	if (!gIsRunning)
	{
		pauseAnimation();
		return;
	}

	// clear settings for system 
	gLammpsWorker.postMessage([MESSAGE_CLEAR]);

	// Check user settings for timestemp
	gLammpsWorker.postMessage("timestep " + gTimestep);

	// check if user interacted with molecule. If so, run minimization
	if (gIsInteracting != undefined && gAtomSelection != undefined && gAtomSelection != null && gAtomSelection.length > 0) {
		gLammpsWorker.postMessage([MESSAGE_GROUP_ATOMS, [NAME_GROUP_INTERACTION, gAtomSelection]]);
	
		// if drag, displace atoms and don't run dynamics
		if (gIsInteracting == 'drag') {
			gLammpsWorker.postMessage([MESSAGE_DRAG_MOLECULE, gVector]);
			// drag is ONE TIME interaction
			gIsInteracting = undefined;	
			return;		
		}	
		// if pull, still perform dynamics			
		else if (gIsInteracting == 'pull') {
			// pull is continuous interaction
			let addForceCmd = "fix fix_interaction " + NAME_GROUP_INTERACTION + " addforce " + gVector[0].toString() + " " + gVector[1].toString() + " " + gVector[2].toString();
			gLammpsWorker.postMessage(addForceCmd);
		}
	}

	// NORMAL DYNAMICS
	let nveFixCmd = "fix fix_nve all nve";
	gLammpsWorker.postMessage(nveFixCmd);	
	
	let langevinFixCmd = "fix fix_langevin all langevin " + gStartTemp.toString() + " " + gEndTemp.toString() + " " + gDampTemp.toString() + " 48279"; 
	gLammpsWorker.postMessage(langevinFixCmd);

	// recenter
	if(gRecenter) {
		let recenterCmd = "fix fix_recenter all recenter INIT INIT INIT";
		gLammpsWorker.postMessage(recenterCmd);	
	} 
	else {
		gLammpsWorker.postMessage([MESSAGE_REMOVE_FIX, "fix_recenter"]); 
	}
	
	// shake hydrogen
	if(gShakeHydrogen) {
		let shakeHbondCmd = "fix fix_shake_hbond all shake 0.0001 20 0 m 1.0";
		gLammpsWorker.postMessage(shakeHbondCmd);
	}
	else {
		gLammpsWorker.postMessage([MESSAGE_REMOVE_FIX, "fix_shake_hbond"]);
	}

	gLammpsWorker.postMessage([MESSAGE_RUN_DYNAMICS, [gDuration, gOutputFreq]]);
}

