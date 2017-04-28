/************* Viewer Global Variables *************/
window.latestFrame = null;

/************* Viewer Callbacks *************/

function createViewer() {
	let container = document.querySelector('#molViewer');
	let options = { headless: true };
	window.myViewer = new Autodesk.$ADSKMOLVIEW(container, options); 
	myViewer.mv.addEventListener(Autodesk.Viewing.VIEWER_INITIALIZED, molViewInitialized);
}

const molViewModelSelected = () => {
	console.log("RECEIVED SELECTION EVENT!");
	
	// NOTE: molViewModelSelected gets called when the molecule is first loaded
	if(latestFrame == null)
		return;
	
	let sel = myViewer.getSelection();
	let selectedAtoms;
	for(let key in sel) {
		selectedAtoms = sel[key].atomID;
		break;
	}
	
	// if atoms were selected, group them!
	if(selectedAtoms != null && selectedAtoms != undefined && selectedAtoms.length > 0) {
		gAtomSelection = selectedAtoms;	
	}
	else {
		gAtomSelection = null;
	}
}

const molViewInitialized = () => {
	if (this.moleculeViewer) {
		this.moleculeViewer.mv.removeEventListener(
		Autodesk.Viewing.VIEWER_INITIALIZED, molViewInitialized);
	}
	console.log("VIEWER: Viewer initialized!");

	// register interaction tool
	myViewer.mv.toolController.registerTool(molInteractionTool);
};


const molViewModelLoaded = () => {
	if (myViewer) {
		myViewer.mv.removeEventListener(
		Autodesk.Nano.MODEL_END_LOADED_EVENT, molViewModelLoaded);
	}
	console.log("VIEWER: About to change representation!");
	myViewer.setModelRepresentation(myViewer.getModelID(), 'ribbon', false);		
	myViewer.setModelRepresentation(myViewer.getModelID(), 'CPK', true);		
	
	resolve();
};


// resolve after molecule loaded
function resolve()
{
	console.log("Resolving");
	var numAtoms = myViewer.mv.TheMolMan.molModels[myViewer.getModelID()].maxNumAtoms;
	console.log("Number of atoms : " + numAtoms);

	if(numAtoms > 500)
	{
		// Disable shake for big molecules 
		document.getElementById('ChckboxShakeHydrogen').disabled = true;	
	}
	
	// add event listener
	myViewer.mv.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, molViewModelSelected);	
	
	// activate interaction tool
	myViewer.mv.toolController.activateTool(NAME_VIEWER_INTERACTION_TOOL);
				
	// set ready
	gReady = true;

	// Unpause and play simulation 
	togglePlay(true);
}

function loadViewerPdb(pdbData) {
	if(!myViewer)
		return;

	latestFrame = null;
	currentBox = null;	

	console.log(pdbData.length);
	myViewer.mv.addEventListener(Autodesk.Nano.MODEL_END_LOADED_EVENT, molViewModelLoaded);
	myViewer.createMoleculeFromData(pdbData, 'pdb', true);	
}

function setSimulationBox(dimensions) {
	let mat = myViewer.createMaterial(0x111111);
	mat.transparent = true;
	mat.opacity = 0.5;
	
	// get center		
	let center = new THREE.Vector3((dimensions[0]+dimensions[1])/2, (dimensions[2]+dimensions[3])/2, (dimensions[4]+dimensions[5])/2);
	currentBox = myViewer.drawCube(dimensions[1]-dimensions[0], dimensions[3]-dimensions[2], dimensions[5]-dimensions[4], center, mat);
	currentBox.visible = false;
}

function applyAnimationWithPositions(posArray) {
	console.log("VIEWER: Inside apply animation...");	
	let frameArray = [];
	// loop through position array and add animation frame
	for (let i = 0; i < posArray.length; i++) {
		// Array of atoms' positions for frame i
		let positions = posArray[i].split('\n');
		let nthPos = [];
		for(let j = 0; j < positions.length; j++) {
			if(positions[j].length <= 0) continue;
			
			// xyz = position of one atom
			let xyz = positions[j].split(" ");
			nthPos.push(xyz[0]);
			nthPos.push(xyz[1]);
			nthPos.push(xyz[2]);
		}

		let frame = { "positions": new Float32Array(nthPos), "bonds" : myViewer.getOriginalAnimState(myViewer.getModelID()).bonds };
		frameArray.push(frame);
		latestFrame = frame;
	}

	setAnimation(frameArray, 0.5);
}

function pauseAnimation() {
	if(myViewer != null && myViewer != undefined)
		myViewer.setPausedOn(true);
}


/************* Functions *************/
function setAnimation(frame_arry, frame_interval) {
	console.log("VIEWER: about to animate molecule!");
	let id = myViewer.getModelID();

	// clear animation
	myViewer.setPausedOn(false);
	myViewer.clearAnimation();

	// loop through position array and add animation frame
	for (let i = 0; i < frame_arry.length; i++) {
		myViewer.addAnimationFrame(id, frame_arry[i], true);
	}
	let res = myViewer.setAnimateOn(true, frame_interval);
	console.log("VIEWER: Successfully set animation!");
	
	myViewer.removeAllGeometries();
}
