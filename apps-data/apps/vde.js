const widgetsConstants = require('molecular-design-applications-shared').widgetsConstants;

module.exports = {
  title: 'Calculate electronic vertical detachment energy',
  version: "0.1-alpha",
  meta: {
    name: "VDE",
    version: "0.0.1",
    description: "Calculate the electron binding energy of an anionic doublet species using DFT",
    git: "https://github.com/Autodesk/molecular-simulation-tools",
    authors: [],
    display: {
      selectLigands: false,
      bgColor: '#292E60',
      bgIndex: 3,
      color: '#2FE695',
      comingSoon: false,
      creatorImage: '/img/logo2.png',
    }
  },
  widgets: [
    {
      id: "load_pdb",
      type: widgetsConstants.RUN_DOCKER_CONTAINER_FAST,
      meta: {
        title: 'Load Molecule',
      },
      config: {
        image: "avirshup/mst:workflows-0.0.alpha5",
        command: ["minimize", "--preprocess", "/inputs/PDB_DATA"],
      },
      in: [
        { id: 'PDB_DATA' },
      ],
      out: [
        { id: 'prep.pdb' },
        { id: 'prep.json' },
        { id: 'workflow_state.dill' },
      ],
    },
    {
      id: "clean_pdb",
      type: widgetsConstants.RUN_DOCKER_CONTAINER,
      meta: {
        title: 'Run',
      },
      config: {
        image: "avirshup/mst:workflows-0.0.alpha5",
        command: ["minimize", "--preprocess", "/inputs/PDB_DATA"],
      },
      inputs: [
        {
          name: "prep.pdb",
          source: {
            id: "load_pdb", pipe: "prep.pdb"
          }
        },
        {
          name: "prep.json",
          "source": {
            id: "load_pdb", pipe: "prep.json"
          }
        },
        {
          name: "workflow_state.dill",
          "source": {
            id: "load_pdb", pipe: "workflow_state.dill"
          }
        }
      ],
      outputs: [
        { id: 'final_structure.pdb' },
        { id: 'results.json' },
        { id: 'minstep.0.pdb' },
        { id: 'minstep.1.pdb' },
        { id: 'minsteps.tar.gz' },
        { id: 'minstep_frames.json' },
      ],
    },
    {
      id: widgetsConstants.RESULTS,
      type: widgetsConstants.RESULTS,
      title: 'Results',
      inputs: [
        {
          name: "final_structure.pdb",
          source: {
            id: "clean_pdb", pipe: "final_structure.pdb"
          }
        },
        {
          name: "results.json",
          source: {
            id: "clean_pdb", pipe: "results.json"
          }
        },
        {
          name: "minstep.0.pdb",
          source: {
            id: "clean_pdb", pipe: "minstep.0.pdb"
          }
        },
        {
          name: "minstep.1.pdb",
          source: {
            id: "clean_pdb", pipe: "minstep.1.pdb"
          }
        },
        {
          name: "minstep_frames.json",
          source: {
            id: "clean_pdb", pipe: "minstep_frames.json"
          }
        }
      ],
    },
  ],
};
