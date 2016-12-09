cwlVersion: cwl:draft-3
class: Workflow
inputs:
  - id: description
    type: string
  - id: molfile
    type: ["null", File]  # makes this argument optional

hints:
  - class: SubworkflowFeatureRequirement

outputs:
  - id: pdbfile
    type: File
    source: "#vertical_detachment_energy/min.pdb"

  - id: result
    type: File
    source: "#vertical_detachment_energy/result.json"


steps:
  - id: read_molecule
    run: ../nodes/read_molecule.cwl
    inputs:
      - id: description
        source: "#description"
      - id: molfile
        source: "#molfile"
    outputs:
       - id: mdtmol

  - id: vertical_detachment_energy
    run: ../nodes/vertical_detachment_energy.cwl
    inputs:
      - id: mdtfile
        source: "#read_molecule/mdtmol"
    outputs:
      - id: pdbfile
