/** @type {!Array<snapshot>} snapshotList */
// snapshotList[filename] = { isInteracting: .., vector: .., atomSelection: .. }};
let snapshotList = {};	// dictionary of snapshots

let latestSnapshotNum = 0;	// Last snapshot number
let loadedMol = {name: '', pdbData: '', lmpsData: ''};


/********** Called only once ***********/
initGlobalVar();
initWorker();
/**************************************/

initUI();

function initWorker() {
	console.log("Initializing webworker for LAMMPS...");
	if (gLammpsWorker)
		gLammpsWorker.terminate();
			
	gLammpsWorker = new Worker("/interactive-sim/lammps/worker.js");

	// e.data[0] = pipe name or timestamp
	// e.data[1] = array of positions (as string)	
	gLammpsWorker.onmessage = function(e) {
		console.log("Received Message!");
		switch(e.data[0]) {
		case MESSAGE_WORKER_READY:
			let workerReady = e.data[1];
			if(!workerReady)
				break; 
						
			setUpNew('default');
			break;

		case MESSAGE_LAMMPS_DATA:
		case MESSAGE_SNAPSHOT_DATA:
			let success = e.data[1];
			if (success) {
				// set global from input	
				setGlobalsFromInput();
				
				// load molecule if Lammps data
				if(e.data[0] == MESSAGE_LAMMPS_DATA)
					loadViewerPdb(loadedMol.pdbData);
				
				// load from snapshot
				else {
					gReady = true;
					togglePlay(true);
				}
			}
			break;

		case MESSAGE_SAVE_SNAPSHOT:
			// increment latest snapshot number
			latestSnapshotNum += 1;
		
			// create new snapshot object and add to the list
			let snapshotInfo = { isInteracting: gIsInteracting, vector: gVector, atomSelection: gAtomSelection }; 
			let filename = e.data[1];
			snapshotList[filename] = snapshotInfo;
			
			// add snapshot button UI	
			addSnapshotBtn(latestSnapshotNum, filename);	
			
			let listLength = Object.keys(snapshotList).length;	
			if(listLength > VALUE_MAX_SNAPSHOTS) {
				for(let filename in snapshotList) {
					// remove filename from File system	
					gLammpsWorker.postMessage([MESSAGE_REMOVE_FILE, filename]);	
					
					// remove key from dictionary
					delete snapshotList[filename];
					listLength -= 1;
			
					// Check if num of buttons meet the limit 
					if(listLength <= VALUE_MAX_SNAPSHOTS)
						break;
				}	
				// remove snapshot button UI for old snapshots
				removeExcessSnapshotBtns(VALUE_MAX_SNAPSHOTS);
			}
			
			document.getElementById('BtnSaveSnapshot').className = 'btn btn-default';
			break;
						
		case MESSAGE_ENERGY_DATA:
			let totEnergy = e.data[1];
			document.getElementById('TextEnergy').innerText = totEnergy.toString();
			break;		

		case MESSAGE_POSITION_DATA:
			console.log("Received positions data");
			// update animation frames of the viewer
			applyAnimationWithPositions(e.data[1]);
			fireSimulation();
			break;
		
		case MESSAGE_PERFORMANCE:
			let framesPerSec = e.data[1];
			document.getElementById('TextPerformance').innerText = framesPerSec.toString();
			break;

		case MESSAGE_ERROR:
			// Reload Molecule
			gTimestep = 1.0;
			gShakeHydrogen = false;
			gIsInteracting = undefined;
			gVector = undefined;
			gAtomSelection = undefined;
			
			setUpNew(loadedMol.name);
			break;	
		
		default:
			break;
		}
	}

}

// Kick start the simulation 
function setUpNew(mol) {
	gReady = false;
	togglePlay(false);

	// Clear snapshot list if it is not empty and a different molecule was loaded 
	let listLength = Object.keys(snapshotList).length; 
	if (listLength > 0 && mol != loadedMol.name) {
                for(let filename in snapshotList)
		{
			gLammpsWorker.postMessage([MESSAGE_REMOVE_FILE, filename]);
			delete snapshotList[filename];
		}
		removeExcessSnapshotBtns(0);
		latestSnapshotNum = 0;
        }	
		
	// determine which molecule to load
	var loadButtons = document.getElementsByClassName('BtnLoadNew');
	setElementsClass(loadButtons, 'BtnLoadNew btn btn-default');
	switch(mol) {
	case '1yu8':
		loadedMol.lmpsData = LAMMPS_1YU8;
		loadedMol.pdbData = PDB_1YU8;
		if(loadedMol.name != mol) {
			gDuration = 10;
			gOutputFreq = 10;
		}
		
		document.getElementById('BtnLoad1yu8').className = 'BtnLoadNew btn btn-primary';
		break;
	case '1yu8-0-30':
		loadedMol.lmpsData = LAMMPS_1YU8_0_30;
		loadedMol.pdbData = PDB_1YU8_0_30;
		if(loadedMol.name != mol) {
			gDuration = 30;
			gOutputFreq = 30;
		}
		
		document.getElementById('BtnLoadRes-0-30').className = 'BtnLoadNew btn btn-primary';
		break;

	case '1yu8-30-40':
	default:
		loadedMol.lmpsData = LAMMPS_1YU8_30_40;
		loadedMol.pdbData = PDB_1YU8_30_40;	
		if(loadedMol.name != mol) {
			gDuration = 100;
			gOutputFreq = 100;
		}
		document.getElementById('BtnLoadRes-30-40').className = 'BtnLoadNew btn btn-primary';
		break;

	}
	
	// set loaded molecule name
	loadedMol.name = mol;
	
	// re init UI
	initUI();
	
	// Create brand new system	
	gLammpsWorker.postMessage([MESSAGE_LAMMPS_DATA, loadedMol.lmpsData]);
}
	
// Kick start the simulation 
function setUpFromSnapshot(filename) {
	gReady = false;

	// Create from latest snapshot (automatically saved not saved by user) 
	if (filename == undefined || filename == null)
		gLammpsWorker.postMessage([MESSAGE_SNAPSHOT_DATA, undefined]);	
	
	// Create from indicated snapshot
	else
	{
		let snapshot = snapshotList[filename]; 
		gLammpsWorker.postMessage([MESSAGE_SNAPSHOT_DATA, filename]);
		gIsInteracting = snapshot.isInteracting;
		gVector = snapshot.vector;
		gAtomSelection = snapshot.atomSelection;
	}
}
	
// Trigger snapshot save
function requestForSnapshot() {
	
	// if already at max number of snapshots, remove the oldest	
	let newSnapshotNum = latestSnapshotNum + 1;

	// Make button red to indicate that request for snapshot was registered
	document.getElementById('BtnSaveSnapshot').className = 'btn btn-danger';

	// Save snapshot
	gLammpsWorker.postMessage([MESSAGE_SAVE_SNAPSHOT, "snapshot-" + newSnapshotNum.toString() + ".saved"]);
}


