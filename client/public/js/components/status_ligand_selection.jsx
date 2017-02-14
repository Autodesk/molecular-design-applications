import React from 'react';
import { List as IList } from 'immutable';

import '../../css/status_ligand_selection.scss';

class StatusLigandSelection extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeSelection = this.onChangeSelection.bind(this);
  }

  onChangeSelection(e) {
    if (e.target.value !== this.props.selectedLigand) {
      this.props.changeLigandSelection(e.target.value);
    }
  }

  render() {
    let ligands;
    if (!this.props.ligandNames) {
      ligands = (
        <p>Please select an input with ligands in step 1.</p>
      );
    } else {
      if (this.props.ligandNames.size <= 0) {
        throw new Error('Invalid ligands');
      }
      if (this.props.ligandNames.size === 1) {
        ligands = (
          <p>
            We&#39;ll use the only ligand available, {this.props.ligandNames.get(0)}.
          </p>
        );
      } else {
        ligands = (
          <div>
            <p>
              We found more than one ligand.  Please select one.
            </p>
            <ul>
              {
                this.props.ligandNames.map((ligandName, index) =>
                  <li className="ligand" key={index}>
                    <input
                      type="radio"
                      id={`ligand-${ligandName}`}
                      name="ligands"
                      value={ligandName}
                      checked={this.props.selectedLigand === ligandName}
                      onChange={this.onChangeSelection}
                    />
                    <label htmlFor={`ligand-${ligandName}`}>{ligandName}</label>
                  </li>
                )
              }
            </ul>
          </div>
        );
      }
    }

    return (
      <div className="status-ligand-selection">
        {ligands}
      </div>
    );
  }
}

StatusLigandSelection.propTypes = {
  changeLigandSelection: React.PropTypes.func,
  ligandNames: React.PropTypes.instanceOf(IList),
  selectedLigand: React.PropTypes.string,
};

export default StatusLigandSelection;
