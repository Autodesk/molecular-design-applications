const tasksConstants = require('molecular-design-applications-shared').tasksConstants;

const workflows = [
  {
    id: '0',
    title: 'Calculate electronic vertical detachment energy',
    selectLigands: false,
    bgColor: '#292E60',
    bgIndex: 3,
    color: '#2FE695',
    comingSoon: false,
    creatorImage: '/img/logo2.png',
    description: 'Calculate the electron binding energy of an' +
        ' anionic doublet species using DFT',
    tasks: [
      {
        id: tasksConstants.LOAD,
        url: 'TODOmodifyworkflowutils.executeWorkflow0Step0',
      },
      {
        id: tasksConstants.RUN,
        url: 'TODOmodifyworkflowutils.executeWorkflow0Step0',
        inputs: {
          TODO: 'howwouldthiswork?',
        },
      },
    ],
    viewCount: 0,
  },
  {
    id: '1',
    title: 'Refine a protein-ligand complex',
    selectLigands: true,
    bgIndex: 3,
    bgColor: '#292E60',
    color: '#2FE695',
    comingSoon: false,
    creatorImage: '/img/logo1.png',
    description: 'Automatically parameterize and refine a small molecule bound to a protein',
    tasks: [
      {
        id: tasksConstants.LOAD,
        url: 'TODOmodifyworkflowutils.executeWorkflow0Step0',
      },
      {
        id: tasksConstants.SELECTION,
        url: 'TODOmodifyworkflowutils.executeWorkflow0Step0',
        inputs: {
          TODO: 'howwouldthiswork?',
        },
      },
      {
        id: tasksConstants.RUN,
        url: 'TODOmodifyworkflowutils.executeWorkflow0Step0',
        inputs: {
          TODO: 'howwouldthiswork?',
        },
      },
    ],
    viewCount: 0,
  },
  {
    id: '2',
    title: 'Predict perceived color and UV-Vis spectrum',
    bgColor: '#DE2755',
    bgIndex: 1,
    color: '#FFFFFF',
    comingSoon: true,
    creatorImage: '/img/logo2.png',
    description: "Predict a small molecule's perceived color and" +
        ' its UV-Viz spectra using TD-DFT',
    viewCount: 0,
  },
  {
    id: '3',
    title: 'Calculate solvation free energy',
    bgColor: '#3F602F',
    bgIndex: 0,
    color: '#05C98E',
    comingSoon: true,
    creatorImage: '/img/logo2.png',
    description: 'Predict the solvation free energy of a small molecule in water using' +
        ' thermodynamic integration',
    viewCount: 0,
  },
];

module.exports = workflows;
