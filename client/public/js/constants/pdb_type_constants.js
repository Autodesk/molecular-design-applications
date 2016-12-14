import keyMirror from 'keymirror';

const pdbTypeConstants = keyMirror({
  ATOM: null,
  BOND: null,
  RESIDUE: null,
  CHAIN: null,
  IGNORED: null,
});

export default pdbTypeConstants;
