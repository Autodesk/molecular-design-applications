var molInteractionTool = {
	_names: [NAME_VIEWER_INTERACTION_TOOL],
	_active: false,

	_cachedX: null,
	_cachedY: null,		
	_isDragging: false,
	_isPending: false, // for displacement
		
	//_hitObject :null,
	getNames: function() {
		return this._names;
	},
	getName: function() {
		return this._names[0];
	},
	isActive: function() {
		return this._active;
	},
	activate: function() {
		this._active = true;
	},
	deactivate: function() {
		this._active = false;
	},

	getCursor: function() {
		return (this._isDragging || this._isPending) ? "pointer" : null;
	},

	handleButtonDown  : function (event, button) {
		if(gAtomSelection == null || gAtomSelection == undefined || gAtomSelection.length < 1)
			return false;
		
		// Atoms were selected 
		this._isDragging = true;
		this._cachedX = event.clientX;
		this._cachedY = event.clientY;
		// Don't want pan to  be activated
		return true;
	},

	handleMouseMove  : function (event) {
		
		// Check if dragging 
		if(!this._isDragging || this._cachedX == null || this._cachedX == undefined) {
			this._isPending = false;
			return false;
		}

		let diffX = Math.abs(event.clientX - this._cachedX);
		let diffY = Math.abs(event.clientY - this._cachedY);
		let vector = [diffX * event.normalizedX / 10, diffY * event.normalizedY / 10, 0]; 

		// If both X and Y differences are 0, no need for interaction 
		if(vector[0] == 0 && vector[1] == 0)
			return false;
			
		// draw Arrows
		let atomSelection = gAtomSelection;
		drawArrows(atomSelection, vector);	
	
		// Set globals 
		gVector = vector;	
		
		// If 'drag' mode, interaction doesn't occur right away - happens on mouse button up	
		if (document.getElementById('RadioModeDrag').checked) {
			
			this._isPending = true;
			
			// Set interactive mode 
			gIsInteracting = undefined;
		}
	
		// If 'pull' mode, interaction happens continuously (not one time)	
		else if (document.getElementById('RadioModePull').checked) {
			
			this._isPending = false;
				
			// Set interactive mode		
			gIsInteracting = 'pull';	
		}
		return false;
	},

	handleButtonUp :  function (event, button) {
		// Pending interaction - drag - takes place when mouse button is up
		if(this._isPending == true) {
			// Set interactive mode 
			gIsInteracting = 'drag';
		}
	
		// Not pending - no interaction or ending of pull interaction	
		else {
			// Set globals
			gIsInteracting = undefined;
			gVector = null;
			gAtomSelection = null;
		}	
	
		// Since mouse button is up, no longer dragging
		// Clear the cache	
		this._isDragging = false;	
		this._isPending = false;	
		this._cachedX = null;
		this._cachedY = null;
			
		return false;

	}

};
