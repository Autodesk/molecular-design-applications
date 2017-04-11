/******************************* Requirements **************************************/
self.Module = {
	preRun: [],
	print: function(text){ console.log(text); return; },
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
const NAME_FIX_RECENTER = "fix_recenter";

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
			//console.log(readDataCmd);
			lmpsForWeb.execute_cmd(readDataCmd);		
		}
		//  MESSAGE_SNAPSHOT_DATA
		else {
			let dataFileName = e.data[1];
			let readRestartCmd = "read_restart " + dirPath + dataFileName;
			//console.log(readRestartCmd);
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

	case MESSAGE_CLEAR:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
		lmpsForWeb.check_and_refresh();
		lmpsForWeb.remove_all_fix();
		break;	

	// group atoms together 
	case MESSAGE_GROUP_ATOMS:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
		
		let groupSettings = e.data[1];
	
		if(groupSettings.length != 2 || groupSettings[1] == null || groupSettings[1] == undefined) {
			//console.log("WORKER: Invalid atom selection");
			break;
		}
		let groupName = groupSettings[0];	
		let atomIndices = groupSettings[1];
	
		let atomIdsString = "";
		for(let i = 0; i < atomIndices.length; i++) {
			let atomId = atomIndices[i] + 1;
			atomIdsString = atomIdsString + atomId.toString() + " "; 
		}

		if(lmpsForWeb.does_group_exist(groupName))
			lmpsForWeb.execute_cmd("group " + groupName + " clear");
		
		let groupCmd = "group " + groupName + " id " + atomIdsString.trim();
		lmpsForWeb.execute_cmd(groupCmd);
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
			//console.log("WORKER: Successfully ran dynamics!");
		
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
			//console.log('WORKER: Could not displace atoms!');
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
			//console.log("WORKER: Successfully ran interaction!");
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
	
	case MESSAGE_REMOVE_FILE:
		if(e.data.length != 2)
			break;

		try {
			let dirPath = Module.get_dir_path();
			let filePath = dirPath + e.data[1];
			FS.unlink(filePath);
		} catch(e) {
			//console.log("WORKER: Could not delete file");	
		}
		
		break;

	case MESSAGE_REMOVE_FIX:
		if(lmpsForWeb == null || lmpsForWeb == undefined)
			break;
		
		let fixName = e.data[1];
		
		// remove fix if it exists
		if(lmpsForWeb.does_fix_exist(fixName))
			lmpsForWeb.execute_cmd("unfix " + fixName);

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
