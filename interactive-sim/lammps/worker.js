/******************************* Requirements **************************************/
self.Module = {
	preRun: [],
	print: function(text){ return; },
	postRun: function(){ console.log("Finished Running Main"); postMessage([MESSAGE_WORKER_READY, true]); }
};

importScripts('/interactive-sim/js/constant.js');

console.log("WORKER: About to load wasm binary");
let xhr = new XMLHttpRequest();
xhr.open('GET', '/interactive-sim/lammps/emscripten.wasm', true);
xhr.responseType = 'arraybuffer';
xhr.onload = function() {
	Module.wasmBinary = xhr.response;
	console.log("WORKER: importing emscripten.js");
	importScripts('/interactive-sim/lammps/emscripten.js');
};
xhr.send(null);

/******************************* LAMMPS Variables *******************************/
const NAME_FIX_NVT = "fix_nvt";
const NAME_FIX_ADDFORCE = "fix_addforce";
const NAME_FIX_RECENTER = "fix_recenter";
const NAME_FIX_LANGEVIN = "fix_langevin";

var lmpsForWeb = null;


/******************************* functions *******************************/
// get total energy from dump file of each atom's energy
function getTotalEnergy(energyDataString) {
        let energyPerAtom = energyDataString.split('\n');
        // loop through position array and add animation frame

        let totalEnergy = 0;
        for (let i = 0; i < energyPerAtom.length; i++) {
                let atomEnergy = parseFloat(energyPerAtom[i]);
                if(!isNaN(atomEnergy))
                        totalEnergy += atomEnergy;
        }
        return totalEnergy;
}

function setUpAsCharmm()
{
	if(lmpsForWeb == null || lmpsForWeb == undefined)
		return;
	
	lmpsForWeb.execute_cmd("units real");
	lmpsForWeb.execute_cmd("dimension 3");
	lmpsForWeb.execute_cmd("atom_style full");
	lmpsForWeb.execute_cmd("pair_style lj/charmm/coul/charmm/implicit 8.0 10.0");
	lmpsForWeb.execute_cmd("bond_style harmonic");
	lmpsForWeb.execute_cmd("angle_style harmonic");
	lmpsForWeb.execute_cmd("dihedral_style harmonic");
	lmpsForWeb.execute_cmd("improper_style harmonic");
}

/******************************* Web Worker Callback *******************************/
onmessage = function(e) {

	// Message array for posting message back to the main thread
	/** @type {string} message[0]  **/
	/** @type {...} message[1]  **/
	let message = [];
	
	switch(e.data[0]) {	
	// Create lammps system
	case MESSAGE_LAMMPS_DATA:
	case MESSAGE_SNAPSHOT_DATA:
		if(e.data.length != 2)
			break;		

		let dirPath;
		try {
			// Get directory path. This ensures Module is loaded properly 
			dirPath = Module.get_dir_path();
		} catch(e) {
			break;
		}
			
		message.length = 0;
		message.push(e.data[0]);			
		
		// delete old system
		if(lmpsForWeb != null && lmpsForWeb != undefined) {
			lmpsForWeb.delete();	
			lmpsForWeb = null;
		}

		let d = new Date();
		let id = d.getTime()%111111;
		
		// Create lammps web object
		lmpsForWeb = new Module.Lammps_Web(id);
		
		// MESSAGE_LAMMPS_DATA
		if(e.data[0] == MESSAGE_LAMMPS_DATA) {
			setUpAsCharmm();

			let molData = e.data[1];
			let dataFileName = id.toString() + ".data";
			FS.createDataFile(dirPath, dataFileName, molData, true, true);
			let readDataCmd = "read_data " + dirPath + dataFileName;
			console.log(readDataCmd);
			lmpsForWeb.execute_cmd(readDataCmd);		
		}
		//  MESSAGE_SNAPSHOT_DATA
		else {
			let dataFileName = e.data[1];
			let readRestartCmd = "read_restart " + dirPath + dataFileName;
			console.log(readRestartCmd);
			lmpsForWeb.execute_cmd(readRestartCmd);
		}

		lmpsForWeb.execute_cmd("neighbor 2.0 bin");
		lmpsForWeb.execute_cmd("neigh_modify delay 5");
		lmpsForWeb.execute_cmd("timestep 1");
		lmpsForWeb.execute_cmd("dielectric 4.0");
	
		message.push(true);
		postMessage(message);
		break;
	
	case MESSAGE_SAVE_SNAPSHOT:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
	
		if(e.data[1] == null || e.data[1] == undefined)
			break;

		let saveFileName = e.data[1];	
		lmpsForWeb.save_snapshot(saveFileName);
	
		message.length = 0;
		message.push(e.data[0]);
		message.push(saveFileName);
		postMessage(message);
		break;

	// group atoms together 
	case MESSAGE_GROUP_ATOMS:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
		
		let groupSettings = e.data[1];
	
		if(groupSettings.length != 2 || groupSettings[1] == null || groupSettings[1] == undefined) {
			console.log("WORKER: Invalid atom selection");
			break;
		}
		let groupName = groupSettings[0];	
		let atomIndices = groupSettings[1];
	
		let atomIdsString = "";
		for(let i = 0; i < atomIndices.length; i++) {
			let atomId = atomIndices[i] + 1;
			atomIdsString = atomIdsString + atomId.toString() + " "; 
		}
		lmpsForWeb.set_atoms_group(groupName, atomIdsString.trim());
		break;

	// Set temperature settings for nvt simulation	
	case MESSAGE_NVT:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break; 
		
		let tempValues = e.data[1];
		if(tempValues == null || tempValues.length != 3) {
			console.log('WORKER: Enter temp setting');
			break;
		}
		// apply settings
		
		let nvtFixCmd = "fix " + NAME_FIX_NVT + " all nvt temp " + tempValues[0].toString() + " " + tempValues[1].toString() + " " + tempValues[2].toString(); 
		console.log("WORKER: " + nvtFixCmd); 
		lmpsForWeb.add_fix(NAME_FIX_NVT, nvtFixCmd);	
		break;

	case MESSAGE_LANGEVIN:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break; 
		
		let langeTemp = e.data[1];
		if(langeTemp == null || langeTemp.length != 3) {
			console.log('WORKER: Enter temp setting');
			break;
		}
		// apply settings
		let nveFixCmd = "fix fix_nve all nve";
		lmpsForWeb.add_fix("fix_nve", nveFixCmd);	
		let langevinFixCmd = "fix " + NAME_FIX_LANGEVIN + " all langevin " + langeTemp[0].toString() + " " + langeTemp[1].toString() + " " + langeTemp[2].toString() + " 48279"; 
		console.log("WORKER: " + langevinFixCmd); 
		lmpsForWeb.add_fix(NAME_FIX_LANGEVIN, langevinFixCmd);	
		break;
	
	// Fix shake by element mass
	case MESSAGE_FIX_SHAKE:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;	
		
		let shakeSettings = e.data[1];
		if(shakeSettings == null || shakeSettings == undefined || shakeSettings.length != 2)
			break;
		
		let shakeName = shakeSettings[0];	// shake ID	
		let massStringValue = shakeSettings[1];	// masses of elements to shake
		
		// if mass string value is undefined, remove the fix with the shake ID
		if(massStringValue == null || massStringValue == undefined)
		{
			lmpsForWeb.remove_fix(shakeName);
		}
		else
		{
			let shakeCmd = "fix " + shakeName + " all shake 0.0001 20 0 m " + massStringValue;
			console.log("WORKER: " + shakeCmd);
			lmpsForWeb.add_fix(shakeName, shakeCmd);
		}				

		break;

	// Fix recenter	
	case MESSAGE_FIX_RECENTER:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
		
		let recenter = e.data[1];
		if(recenter)
		{
			let recenterCmd = "fix " + NAME_FIX_RECENTER + " all recenter INIT INIT INIT"; 
			console.log("WORKER: " + recenterCmd);
			lmpsForWeb.add_fix(NAME_FIX_RECENTER, recenterCmd);
		}
		else
		{
			lmpsForWeb.remove_fix(NAME_FIX_RECENTER);
		}
		break;
	
	// Run dynamics			
	case MESSAGE_RUN_DYNAMICS:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;

		/** @type {!Array<number>} */	
		let simSettings = e.data[1]
			
		// time before simulation
		let startTime = new Date().getTime();

		try {
			let totIter = simSettings[0];			
			let outputFreq = simSettings[1];
		
			// run dynamics	
			let runNum = lmpsForWeb.run_dynamics(totIter, outputFreq);
			
			// log time	
			let endTime = new Date().getTime();
			let timeMs = endTime - startTime;
			
			// send energy analysis
			let dataString = lmpsForWeb.get_energy(runNum);	
			let energy = getTotalEnergy(dataString);	
			message.length = 0;
			message.push(MESSAGE_ENERGY_DATA);
			message.push(energy);
			postMessage(message);
			
			// send performance	
			message.length = 0;
			message.push(MESSAGE_PERFORMANCE);
			message.push(timeMs);	
			postMessage(message);

			// send positions
			let posArray = lmpsForWeb.get_frames(runNum);
			message.length = 0;
			message.push(MESSAGE_POSITION_DATA);
			message.push(posArray);
			postMessage(message);
			console.log("WORKER: Successfully ran dynamics!");
		
		} catch(err) {
			lmpsForWeb.delete();
			lmpsForWeb = null;
	
			message.length = 0;
			message.push(MESSAGE_ERROR);
			postMessage(message);
			break;		
		}	
		
		break;

	// Run atom displacement + minimization	
	case MESSAGE_DRAG_MOLECULE:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
	
		/** @type {!Array<number>} */	
		let vector = e.data[1];	
		if(vector == null || vector.length != 3 || !lmpsForWeb.does_group_exist(NAME_GROUP_INTERACTION)) {
			console.log('WORKER: Could not displace atoms!');
			break;
		}
		
			
		try {
			// Displace atoms
			let displaceCmd = "displace_atoms " + NAME_GROUP_INTERACTION + " move " + vector[0].toString() + " "  + vector[1].toString() + " " + vector[2].toString();
			lmpsForWeb.execute_cmd(displaceCmd);

			let runNum = lmpsForWeb.minimize(10);
			let posArray = lmpsForWeb.get_frames(runNum);
			
			message.length = 0;
			message.push(MESSAGE_POSITION_DATA);
			message.push(posArray);
			console.log("WORKER: Successfully ran interaction!");
			postMessage(message);
		} catch(err) {
			lmpsForWeb.delete();
			lmpsForWeb = null;		
	
			message.length = 0;
			message.push(MESSAGE_ERROR);
			postMessage(message);
			break;		
		}	
		
		break;

	case MESSAGE_PULL_MOLECULE:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;	
	
		let addForceVector = e.data[1];
		
		// If force vector isn't specified or interaction group does not exist, don't add the fix
		if(addForceVector == null || addForceVector ==undefined || addForceVector.length !=3 || !lmpsForWeb.does_group_exist(NAME_GROUP_INTERACTION)) {
			lmpsForWeb.remove_fix(NAME_FIX_ADDFORCE);
		}
		else {
	
			let addForceCmd = "fix " + NAME_FIX_ADDFORCE + " " + NAME_GROUP_INTERACTION + " addforce " + addForceVector[0].toString() + " " + addForceVector[1].toString() + " " + addForceVector[2].toString();
			console.log("WORKER: " + addForceCmd);
			lmpsForWeb.add_fix(NAME_FIX_ADDFORCE, addForceCmd);
		}	
			
		break;	

	// Run minimization
	case MESSAGE_RUN_MINIMIZATION:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
		
		let outputFreq = e.data[1];
		if(outputFreq <= 0)
			break;
		
		let runNum = lmpsForWeb.minimize(outputFreq);
		let posArray = lmpsForWeb.get_frames(runNum);
		
		message.length = 0;
		message.push(MESSAGE_POSITION_DATA);
		results.push(posArray);
		console.log("WORKER: Successfully ran minimization");
		postMessage(results); 
		 
		break;
	
	case MESSAGE_REMOVE_FILE:
		if(e.data.length != 2)
			break;

		try {
			let dirPath = Module.get_dir_path();
			let filePath = dirPath + e.data[1];
			FS.unlink(filePath);
		} catch(e) {
			console.log("WORKER: Could not delete file");	
		}
		
		break;
	
	case MESSAGE_SIMULATION_BOX:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
	
		message.length = 0;	
		message.push(e.data[0]);	
		message.push(lmpsForWeb.get_simulation_box());
		postMessage(message);				
		break;

	// execute command
	default:
		console.log("WORKER: command - " + e.data);
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
		
		try {
			lmpsForWeb.execute_cmd(e.data);
		} catch(e) {
			lmpsForWeb.delete();
			lmpsForWeb = null;
	
			message.length = 0;	
			message.push(MESSAGE_ERROR);
			postMessage(message);
			break;
		}
		break;	

	}
}
