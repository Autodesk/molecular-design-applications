import React from 'react';
import { List as IList } from 'immutable';
import WorkflowRecord from '../records/workflow_record';
import MoleculeViewerWrapper from '../utils/molecule_viewer_wrapper';
import InteractiveMoleculeViewerWrapper from '../utils/interactive_molecule_viewer_wrapper';
import loadImg from '../../img/loadAnim.gif';
import '../../css/view.scss';

class View extends React.Component {
  componentDidMount() {
    if (this.props.workflow.id === '4') {
      this.renderInteractiveMoleculeViewer(
        this.props.modelData,
        null,
        this.props.loading,
      );
    } else {
      this.renderMoleculeViewer(
        this.props.modelData,
        null,
        this.props.selectionStrings,
        this.props.loading,
      );
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.workflow.id === '4') {
      this.renderInteractiveMoleculeViewer(
        nextProps.modelData,
        this.props.modelData,
        nextProps.loading,
      );
    } else {
      this.renderMoleculeViewer(
        nextProps.modelData,
        this.props.modelData,
        nextProps.selectionStrings,
        nextProps.loading,
      );
    }
  }

  renderInteractiveMoleculeViewer(modelData, oldModelData, loading) {
    // Destroy the existing molviewer if a new molecule is being loaded
    if (loading && this.moleculeViewerW) {
      // TODO the molviewer api should provide a better way to destroy itself
      console.log('destroy molecule viewer');
      this.moleculeViewerW.destroy();
      this.moleculeViewerW = undefined;
    } else if (modelData && !this.moleculeViewerW) {
      // Create molviewer with new molecule data
      console.log('create molecule viewer');
      this.moleculeViewerW = new InteractiveMoleculeViewerWrapper(
        this.moleculeViewerContainer,
      );
      this.moleculeViewerW.addModel(modelData);

      // TODO: better way to update the position from other components
      window.updateInteractiveMV = (positionData) => {
        this.moleculeViewerW.applyAnimationWithPositions(positionData);
      };

      // TODO: better way to draw arrows
      window.drawArrowsOnInteractiveMV = (vector) => {
        this.moleculeViewerW.drawArrows(window.gAtomSelection, vector);
      };
    } else if (oldModelData && this.moleculeViewerW) {
      // Switching from Interactive Simulation tab to Load Molecule tab
      this.moleculeViewerW.makeViewerInteractive();
    }
  }

  renderMoleculeViewer(modelData, oldModelData, selectionStrings, loading) {
    // Create or destroy the molviewer when needed
    if ((loading || !modelData) && this.moleculeViewerW) {
      // TODO the molviewer api should provide a better way to destroy itself
      this.moleculeViewerW.destroy();
      this.moleculeViewerW = undefined;
    } else if (modelData && !this.moleculeViewerW) {
      this.moleculeViewerW = new MoleculeViewerWrapper(
        this.moleculeViewerContainer,
      );
    }

    // Update the model whenever it's different than last render
    if (modelData && this.moleculeViewerW) {
      if (modelData !== oldModelData) {
        this.moleculeViewerW.addModel(modelData);
      }

      if (selectionStrings) {
        this.moleculeViewerW.select(selectionStrings);
      }
    }

  // TODO colorized like: moleculeViewer.setColor('ribbon', 'blue', '1');
  }

  render() {
    let view;
    if (this.props.error) {
      view = (
        <div>
          <h3>Error</h3>
          <p>{this.props.error}</p>
        </div>
      );
    } else if (this.props.loading) {
      view = (
        <div className="loading">
          <div className="animBack">
            <img src={loadImg} alt="loading" />
          </div>
          <p className="anim">
            Preparing your molecule now ...
          </p>
          <p className="bodyFont">
            (This should only take a few seconds, but there may be delays with heavy traffic)
          </p>
        </div>
      );
    }
    return (
      <div className="view" ref={(c) => { this.moleculeViewerContainer = c; }}>
        {view}
      </div>
    );
  }
}

View.defaultProps = {
  selectionStrings: new IList(),
  modelData: '',
  error: '',
  colorized: false,
};

View.propTypes = {
  colorized: React.PropTypes.bool,
  error: React.PropTypes.string,
  loading: React.PropTypes.bool.isRequired,
  modelData: React.PropTypes.string,
  selectionStrings: React.PropTypes.instanceOf(IList),
  workflow: React.PropTypes.instanceOf(WorkflowRecord),
};

export default View;
