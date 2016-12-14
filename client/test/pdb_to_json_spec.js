import { expect } from 'chai';
import sinon from 'sinon';
import pdbToJson from '../public/js/utils/pdb_to_json';
import pdbTypeConstants from '../public/js/constants/pdb_type_constants';
import pdb from './3AID';

describe('pdbToJson', () => {
  let parseAtomSpy;
  let parseBondSpy;

  beforeEach(() => {
    parseAtomSpy = sinon.spy(pdbToJson, 'parseAtom');
    parseBondSpy = sinon.spy(pdbToJson, 'parseBond');
  });

  afterEach(() => {
    parseAtomSpy.restore();
    parseBondSpy.restore();
  });

  describe('convert', () => {
    it('calls the corresponding parse function for each type', () => {
      pdbToJson.convert(pdb);
      expect(parseAtomSpy.callCount).to.equal(1913);
      expect(parseBondSpy.callCount).to.equal(42);
    });

    it('returns the correct number of atoms and bonds and residues', () => {
      const pdbJson = pdbToJson.convert(pdb);
      expect(pdbJson.atoms.length).to.equal(1912);
      expect(pdbJson.bonds.length).to.equal(88);
      expect(pdbJson.residues.length).to.equal(42);
      expect(pdbJson.chains.length).to.equal(2);
    });

    it('adds chain_index to each residue', () => {
      const pdbJson = pdbToJson.convert(pdb);

      expect(pdbJson.residues[0].chain_index).to.equal(0);
      expect(pdbJson.residues[38].chain_index).to.equal(1);
      expect(pdbJson.residues[39].chain_index).to.equal(null);
      expect(pdbJson.residues[40].chain_index).to.equal(null);
      expect(pdbJson.residues[41].chain_index).to.equal(null);
    });
  });

  describe('getType', () => {
    let line;

    describe('when given a valid atom line', () => {
      beforeEach(() => {
        line = 'ATOM      1  N   PRO A   1      -2.555   9.253  34.411  1.00 30.60           N ';
      });

      it('returns atom type', () => {
        expect(pdbToJson.getType(line)).to.equal(pdbTypeConstants.ATOM);
      });
    });

    describe('when given a valid bond line', () => {
      beforeEach(() => {
        line = 'CONECT 1886 1856                                                                ';
      });

      it('returns bond type', () => {
        expect(pdbToJson.getType(line)).to.equal(pdbTypeConstants.BOND);
      });
    });

    describe('when given an unsupported line', () => {
      beforeEach(() => {
        line = 'IM A PDB LINE OR SOMETHING';
      });

      it('returns ignored type', () => {
        expect(pdbToJson.getType(line)).to.equal(pdbTypeConstants.IGNORED);
      });
    });
  });

  describe('parseAtom', () => {
    let line;

    describe('when given a valid atom line', () => {
      beforeEach(() => {
        line = 'ATOM      1  N   PRO A   1      -2.555   9.253  34.411  1.00 30.60           N ';
      });

      it('returns an object with all needed info parsed out', () => {
        const parsedLine = pdbToJson.parseAtom(line);

        expect(Object.keys(parsedLine).length).to.equal(6);
        expect(parsedLine.serial).to.equal(1);
        expect(parsedLine.name).to.equal('n');
        expect(parsedLine.elem).to.equal('n');
        expect(parsedLine.positions[0]).to.equal(-2.555);
        expect(parsedLine.positions[1]).to.equal(9.253);
        expect(parsedLine.positions[2]).to.equal(34.411);
        expect(parsedLine.residue_index).to.equal(1);
        expect(parsedLine.residue_name).to.equal('PRO A');
      });
    });
  });

  describe('parseBond', () => {
    let line;

    describe('when given a valid bond line with 2 atom serials', () => {
      beforeEach(() => {
        line = 'CONECT 1886 1856                                                                ';
      });

      it('returns an array with a single corresponding bond object', () => {
        const bonds = pdbToJson.parseBond(line);

        expect(bonds.length).to.equal(1);
        expect(bonds[0].atom1_index).to.equal(1886);
        expect(bonds[0].atom2_index).to.equal(1856);
      });
    });

    describe('when given a valid bond line with multiple atom serials', () => {
      beforeEach(() => {
        line = 'CONECT 1849 1850 1851 1852 1853                                                 ';
      });

      it('returns an array of bonds for each pairing with the first', () => {
        const bonds = pdbToJson.parseBond(line);

        expect(bonds.length).to.equal(4);
        expect(bonds[0].atom1_index).to.equal(1849);
        expect(bonds[0].atom2_index).to.equal(1850);
        expect(bonds[1].atom1_index).to.equal(1849);
        expect(bonds[1].atom2_index).to.equal(1851);
        expect(bonds[2].atom1_index).to.equal(1849);
        expect(bonds[2].atom2_index).to.equal(1852);
        expect(bonds[3].atom1_index).to.equal(1849);
        expect(bonds[3].atom2_index).to.equal(1853);
      });
    });
  });

  describe('parseChain', () => {
    describe('when given a valid chain line', () => {
      const line = 'TER     924      PHE A  99                                                      ';
      it('returns json with the given name and empty description', () => {
        const chain = pdbToJson.parseChain(line);
        expect(chain.name).to.equal('PHE');
        expect(chain.description).to.equal('');
      });
    });
  });

  describe('getDistance', () => {
    describe('when given two atoms with valid positions', () => {
      const atomOne = { positions: [0, 0, 0] };
      const atomTwo = { positions: [1, 1, 1] };

      it('returns the correct distance', () => {
        expect(pdbToJson.getDistance(atomOne, atomTwo)).to.equal(Math.sqrt(3));
      });
    });

    describe('when given an atom with an invalid position', () => {
      const atomOne = { positions: [0, 0, null] };
      const atomTwo = { positions: [1, 1, 1] };

      it('throws an error', () => {
        expect(pdbToJson.getDistance.bind(null, atomOne, atomTwo))
          .to.throw(Error);
      });
    });
  });

  describe('calculateBonds', () => {
    describe('when given valid atoms', () => {
      let atoms;

      beforeEach(() => {
        atoms = pdbToJson.convert(pdb).atoms;
      });

      it('returns bonds for each nearest neighbor pair', () => {
        const bonds = pdbToJson.calculateBonds(atoms);
        expect(bonds.length).to.equal(Math.ceil(atoms.length / 2));
      });
    });
  });
});
