const workflows = [
  {
    id: '0',
    title: 'Ligand binding site refinement',
    bgIndex: 0,
    bgColor: '#3762E9',
    color: '#F1FF66',
    comingSoon: false,
    creatorImage: '/img/logo1.png',
    description: 'Refine the geometry of a protein/small molecule binding site using QM/MM',
    viewCount: 0,
  }, {
    id: '1',
    title: 'Vertical detachment energy',
    bgColor: '#292E60',
    bgIndex: 1,
    color: '#2FE695',
    comingSoon: false,
    creatorImage: '/img/logo2.png',
    description: 'Calculate the electron binding energy of an' +
        ' anionic doublet species using DFT',
    viewCount: 0,
  },
  {
    id: '2',
    title: 'Perceived color and UV-Vis spectrum',
    bgColor: '#292E60',
    bgIndex: 1,
    color: '#2FE695',
    comingSoon: true,
    creatorImage: '/img/logo2.png',
    description: "Predict a small molecule's perceived color and" +
        ' its UV-Viz spectra using TD-DFT',
    viewCount: 0,
  },
  {
    id: '3',
    title: 'Solvation free energy',
    bgColor: '#292E60',
    bgIndex: 1,
    color: '#2FE695',
    comingSoon: true,
    creatorImage: '/img/logo2.png',
    description: 'Predict the solvation free energy of a small molecule in water using' +
        ' thermodynamic integration',
    viewCount: 0,
  },
];

module.exports = workflows;

