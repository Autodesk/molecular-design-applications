import React from 'react';
import $ADSKMOLVIEW from 'molecule-viewer-proxy';
import loadImg from '../../img/loadAnim.gif';

require('../../css/view.scss');

class View extends React.Component {
  componentDidMount() {
    this.renderMolecueViewer(this.props.modelData);
  }

  componentWillReceiveProps(nextProps) {
    this.renderMolecueViewer(nextProps.modelData);
  }

  renderMolecueViewer(modelData) {
    if (modelData && !this.moleculeViewer) {
      this.moleculeViewer = new $ADSKMOLVIEW(this.moleculeViewerContainer, {
        headless: true,
      });

      // TODO use modelData instead of hard coded pdbid
      this.moleculeViewer.importPDB('3aid');
    }

    // TODO colorized like: this.moleculeViewer.setColor('ribbon', 'blue', '1');
  }

  render() {
    let view;
    if (this.props.loading) {
      view = (
        <div className="loading">
          <div className="animBack">
            <img src={loadImg} alt="loading" />
          </div>
          <p className="anim">Loading! Great things ahead...</p>
        </div>
      );
    } else if (this.props.error) {
      view = (
        <div>
          <h3>Error</h3>
          <p>{this.props.error}</p>
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

View.propTypes = {
  colorized: React.PropTypes.bool,
  error: React.PropTypes.string,
  loading: React.PropTypes.bool,
  modelData: React.PropTypes.string,
};

export default View;
