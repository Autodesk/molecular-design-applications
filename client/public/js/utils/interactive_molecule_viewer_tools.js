import interactiveSimConstants from '../constants/interactive_sim_constants';

const interactionTool = {
  names: [interactiveSimConstants.NAME_VIEWER_INTERACTION_TOOL],
  active: false,
  cachedX: null,
  cachedY: null,
  isDragging: false,
  isPending: false, // for displacement

  // hitObject :null,
  getNames() {
    return this.names;
  },
  getName() {
    return this.names[0];
  },
  isActive() {
    return this.active;
  },
  activate() {
    this.active = true;
  },
  deactivate() {
    this.active = false;
  },

  getCursor() {
    return (this.isDragging || this.isPending) ? 'pointer' : null;
  },

  handleButtonDown(event) {
    if (!window.gAtomSelection || window.gAtomSelection.length < 1) {
      return false;
    }

    // Atoms were selected
    this.isDragging = true;
    this.cachedX = event.clientX;
    this.cachedY = event.clientY;
    // Don't want pan to  be activated
    return true;
  },

  handleMouseMove(event) {
    // Check if dragging
    if (!this.isDragging) {
      this.isPending = false;
      return false;
    }

    const diffX = Math.abs(event.clientX - this.cachedX);
    const diffY = Math.abs(event.clientY - this.cachedY);
    const vector = [diffX * event.normalizedX / 10, diffY * event.normalizedY / 10, 0];

    // If both X and Y differences are 0, no need for interaction
    if (vector[0] === 0 && vector[1] === 0) {
      return false;
    }

    // Draw arrows on viewer
    window.drawArrowsOnInteractiveMV(vector);

    // Set globals
    window.gVector = vector;

    // If drag mode, should be pending
    if (window.gInteractionMode === 'drag') {
      this.isPending = true;
      window.gIsInteracting = false;
    } else if (window.gInteractionMode === 'pull') {
      this.isPending = false;
      window.gIsInteracting = true;
    }
    return false;
  },

  handleButtonUp() {
    // Pending interaction - drag - takes place when mouse button is up
    if (this.isPending === true) {
      window.gIsInteracting = true;
    } else {
      window.gIsInteracting = true;
      window.gVector = undefined;
      window.gAtomSelection = undefined;
    }

    // Clear interaction
    this.isDragging = false;
    this.isPending = false;
    this.cachedX = null;
    this.cachedY = null;

    return false;
  },
};

export default interactionTool;
