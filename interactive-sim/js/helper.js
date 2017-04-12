/****************************** callbacks *******************************/
$(window).keypress(function (e) {
        if (e.target.tagName == "INPUT")
                return;

        if (e.charCode === 0 || e.charCode === 32) {
                // if space was entered while inputting text, ignore it
                if (e.target.id == "BtnToggleSimulation")
                        return;

                e.preventDefault();
                togglePlay(undefined);
        }
        else if (e.charCode === 112) {
                e.preventDefault();
                requestForSnapshot();
        }

});


function shakeWater(event) {

	if(this.checked) {
		gShakeHydrogen = true;
		gTimestep = 2.0;
		initUI();
	}
	else {
		gShakeHydrogen = false;
		gTimestep = 1.0;
		initUI();
	}
	
	this.blur();
}

$('#ChckboxShakeHydrogen').on('change', shakeWater);

/****************************** Viewer functions *******************************/
function drawArrows(selectedAtoms, vector) {
	myViewer.removeAllGeometries();

	if(myViewer == null || myViewer == undefined || vector == undefined || selectedAtoms == undefined)
		return;
		
	let length = Math.sqrt(vector[0]*vector[0] + vector[1]*vector[1] + vector[2]*vector[2]);	

	// Draw arrows 
	let prevAtomIdx = -1;
	for(let j = 0; j < selectedAtoms.length; j++) {
		// identify number of GROUPS of atoms selected and draw arrow 
		if(prevAtomIdx < 0 || Math.abs(selectedAtoms[j]-prevAtomIdx) > 1) {
			let posIndex = selectedAtoms[j] * 3;
			let posArray = latestFrame.positions;
			let origin = new THREE.Vector3(posArray[posIndex], posArray[posIndex+1], posArray[posIndex+2]);
			let dir = new THREE.Vector3(vector[0]/length, vector[1]/length, vector[2]/length); 
			myViewer.drawArrow(dir, origin, length, 0xf1c40f);	
		}
		prevAtomIdx = selectedAtoms[j];
	}
}

/****************************** helper functions *******************************/
function initUI() {
	document.getElementById("InputTimestep").value = gTimestep;
	document.getElementById("InputDuration").value = gDuration;
	document.getElementById("InputOutputFreq").value = gOutputFreq;
  
	document.getElementById("InputStartTemp").value = gStartTemp;
	document.getElementById("InputEndTemp").value = gEndTemp;
	document.getElementById("InputDampTemp").value = gDampTemp;
	document.getElementById("ChckboxRecenter").checked = gRecenter;
	document.getElementById("ChckboxShakeHydrogen").checked = gShakeHydrogen;
	
	document.getElementById("BtnToggleSimulation").firstElementChild.className = (gIsRunning ? "fa fa-pause" : "fa fa-play");
}

// Apply user's setting from the input textboxes
function setGlobalsFromInput() {
        // timestep
        let newVal = parseFloat(document.getElementById('InputTimestep').value);
        if (newVal != null && newVal != undefined && newVal > 0.0)
                gTimestep = newVal;
        else
                document.getElementById('InputTimestep').value = gTimestep;
	
	// start temp
        newVal = parseFloat(document.getElementById('InputStartTemp').value);
        if (newVal != null && newVal != undefined && newVal > 0.0)
                gStartTemp = newVal;
        else
                document.getElementById('InputStartTemp').value = gStartTemp;

        // end temp
        newVal = parseFloat(document.getElementById('InputEndTemp').value);
        if (newVal != null && newVal != undefined && newVal > 0.0)
                gEndTemp = newVal;
        else
                document.getElementById('InputEndTemp').value = gEndTemp;

        // damp temp
        newVal = parseFloat(document.getElementById('InputDampTemp').value);
        if (newVal != null && newVal != undefined && newVal > 0.0)
                gDampTemp = newVal;
        else
                document.getElementById('InputDampTemp').value = gDampTemp;

	// Output frequency & Duration 
        let newOutputFreq = parseFloat(document.getElementById('InputOutputFreq').value);
        let newDuration = parseFloat(document.getElementById('InputDuration').value);
        	
	if(newOutputFreq != undefined && newDuration != undefined && newDuration >= newOutputFreq) {
		gOutputFreq = newOutputFreq;
		gDuration = newDuration; 
	}
	else {
		document.getElementById('InputOutputFreq').value = gOutputFreq;
		document.getElementById('InputDuration').value = gDuration;
	}
}


function setElementsClass(elements, val) {
	for(let i = 0; i < elements.length; i++) {
		let elem = elements[i];
		elem.className = val;
	}
}

function addSnapshotBtn(snapshotNum, filename) {	
	let newBtn = document.createElement('button');
	let newBtnTxt = document.createTextNode(snapshotNum.toString());
	newBtn.appendChild(newBtnTxt);
	newBtn.className = 'btn btn-default';
	newBtn.onclick = function() { 
		newBtn.blur();
		setUpFromSnapshot(filename); 
	};
	
	let btnGroup = document.getElementById('BtnGroupLoadSnapshot');
	btnGroup.appendChild(newBtn);
}

function removeExcessSnapshotBtns(maxNumBtnsAllowed) {
	
	let btnGroup = document.getElementById('BtnGroupLoadSnapshot');
	let elements= btnGroup.childNodes;
		
	let btnNum = 0;
	for(let i = elements.length-1; i >= 0; i--) {
		let element = elements[i];
		if(element.tagName != 'BUTTON')
			continue;
		// element is BUTTON
		btnNum += 1;
		if(btnNum > maxNumBtnsAllowed) {
			btnGroup.removeChild(element);
		}
	} 
}

function displayCrashReport() {
        // populate dynamics setting
        document.getElementById('TextReportTimestep').innerText = gTimestep.toString();
        document.getElementById('TextReportDuration').innerText = gDuration.toString();

        document.getElementById('TextReportStartTemp').innerText = gStartTemp.toString();
        document.getElementById('TextReportEndTemp').innerText = gEndTemp.toString();
        document.getElementById('TextReportDampTemp').innerText = gDampTemp.toString();

        // populate energy
        document.getElementById('TextReportEnergy').innerText =  document.getElementById('TextEnergy').innerText;

        // populate interaction type
        if(gVector == undefined || gAtomSelection == undefined || gIsInteracting == undefined)
                document.getElementById('TextReportInteraction').className = 'hidden';
               
	else { 
		document.getElementById('TextReportInteraction').className = '';
		if(gIsInteracting == 'pull') {
			document.getElementById('TextReportInteractionType').innerText = "Pull";
			document.getElementById('TextReportVectorUnits').innerText = "Kcal/mol-Angs";
		}
		else if(gIsInteracting == 'drag') {
			document.getElementById('TextReportInteractionType').innerText = "Drag";
			document.getElementById('TextReportVectorUnits').innerText = "Angs";
		}

		// populate atom index list
		let atomIndexString = "";
		for(let i = 0; i < gAtomSelection.length; i++) {
			atomIndexString = atomIndexString + gAtomSelection[i].toString() + " ";
		}
		document.getElementById('TextReportAtomIndex').innerText = atomIndexString;

		// populate vector
		document.getElementById('TextReportVector').innerText = gVector[0].toString() + " " + gVector[1].toString() + " " + gVector[2].toString();
	}

	// show report
	$('#ModalReloadMolecule').modal({ backdrop: 'static', show: true });	
}
