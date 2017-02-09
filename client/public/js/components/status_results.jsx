import React from 'react';
import Button from './button';

import '../../css/status_results.scss';

class StatusResults extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeMorph = this.onChangeMorph.bind(this);
    this.onClickDownload = this.onClickDownload.bind(this);
  }

  onChangeMorph(e) {
    this.props.onChangeMorph(parseInt(e.target.value, 10));
  }

  onClickDownload() {
    window.location.href = this.props.outputPdbUrl;
  }

  render() {
    // Round so that the number doesn't overflow the UI
    const value = Math.round(this.props.resultValue * 10000) / 10000;

    return (
      <div className="status-results">
        <div className="stats">
          <div className="stat">
            <div className="fontHeader line stat-title">
              <div>OUTPUT ENERGY</div>
              <div>{this.props.resultUnit}</div>
            </div>
            <div className="stat-body">
              <div className="stat-body-item">
                <div className="fontLarge">{value}</div>
              </div>
            </div>
          </div>
          <div>
            <label className="fontHeader morph-label" htmlFor="morph">MORPH</label>
            <input
              id="morph"
              type="range"
              min="0"
              max={this.props.numberOfPdbs - 1}
              step="1"
              value={this.props.morph}
              onChange={this.onChangeMorph}
            />
          </div>
          <Button
            type="small"
            onClick={this.props.onClickColorize}
          >
            Colorize
          </Button>
        </div>
        <div className="actions">
          <Button
            type="form"
            onClick={this.onClickDownload}
          >
            Download
          </Button>
          <Button
            type="small"
          >
            Share
          </Button>
        </div>
      </div>
    );
  }
}

StatusResults.defaultProps = {
  outputPdbUrl: '',
  resultValue: 0,
  resultUnit: '',
};

StatusResults.propTypes = {
  onClickColorize: React.PropTypes.func.isRequired,
  onChangeMorph: React.PropTypes.func.isRequired,
  morph: React.PropTypes.number.isRequired,
  numberOfPdbs: React.PropTypes.number.isRequired,
  outputPdbUrl: React.PropTypes.string,
  resultValue: React.PropTypes.number,
  resultUnit: React.PropTypes.string,
};

export default StatusResults;
