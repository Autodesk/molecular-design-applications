#!/usr/bin/env python
import os
import sys
import collections
import json
import yaml

tasklist = {}

TaskType = collections.namedtuple('TaskType',
                                  'name inputs outputs')


cwlheader = {'class': 'CommandLineTool',
             'cwlVersion': 'cwl:draft-3',
             'hints':
                 [{'class': 'DockerRequirement',
                   'dockerImageId': 'mdtscripts'}]}


def task(inputs, outputs, name=None,
         label='Python task definition'):
    fname = name

    def functor(f):
        name = fname if fname is not None else f.__name__

        taskyml = cwlheader.copy()
        taskyml['baseCommand'] = ['mdtscripts.py', f.__name__]
        taskyml['label'] = label
        taskyml['inputs'] = [
            {'id':fid, 'type':typ, 'inputBinding':{'position':i+1}}
            for i,(fid,typ) in enumerate(inputs.iteritems())]
        taskyml['outputs'] = [
                {'id': outfile, 'type': 'File', 'outputBinding': {'glob': filename}}
                for outfile, filename in outputs.iteritems()]

        tasklist[name] = taskyml
        return f
    return functor


@task(inputs={'pdbcode':'string'},
      outputs={'mol':'out.pkl'},
      label='Download molecule from the PDB')
def from_pdb(pdbcode):
    import moldesign as mdt
    mol = mdt.from_pdb(pdbcode)
    mol.write('out.pkl')


@task(inputs={'infile': 'File'},
      outputs={'mol': 'out.pkl'},
      label='Read a molecule from a file (format determined by extension)')
def from_file(infile):
    import moldesign as mdt
    mol = mdt.read(infile)
    mol.write('out.pkl')


@task(inputs={'description': 'string',
              'molfile': '["Null", File]'},
      outputs={'mol': 'out.pkl',
               'pdb': 'out.pdb'},
      label='Get a molecule from any source')
def read_molecule(description, molfile):
    """ All-purpose routine for initializing molecules.
    The input "description" must be a yaml or JSON file with exactly one
    of the following key-value pairs:
     - SMILES: [a smiles string]
     - IUPAC: [an IUPAC string]
     - inCHI: [an inchi identifier]
     - PDB: [a 4-letter PDB code]
     - filename: filename (indicates that the molecule should be read from the
               passed "molfile"

    If "asfile" is passed, then "molfile" should also be present. The format
    will be determined from the filename passed in the description JSON
    """
    import moldesign as mdt

    with open(description, 'r') as infile:
        d = yaml.load(description)
    assert len(d) == 1

    if 'filename' in d:
        format, compression = mdt.fileio._get_format(d['filename'])
        m = mdt.read(molfile, format=format)
    elif 'smiles' in d:
        m = mdt.from_smiles(d['smiles'])
    elif 'iupac' in d:
        assert len(d) == 1
        m = mdt.from_name(d['iupac'])
    elif 'inchi' in d:
        assert len(d) == 1
        m = mdt.from_inchi(d['inchi'])
    else:
        raise ValueError(description)

    m.write('out.pkl')
    m.write('out.pdb')





@task(inputs={'mdtfile':'File', 'chainid':'string'},
      outputs={'mol':'out.pkl'},
      label='Return ligand from specified chain')
def isolate_ligand_from_chain(mdtfile, chainid):
    import moldesign as mdt

    mol = mdt.read(mdtfile)
    newmol = mdt.Molecule(mol.chains[chainid].get_ligand())
    newmol.write('out.pkl')


@task(inputs={'mdtfile': 'File'},
      outputs={'pdbfile': 'out.pdb'},
      label='Create PDB-format output file')
def to_pdb(mdtfile):
    import moldesign as mdt

    mdt.read(mdtfile).write('out.pdb')


@task(inputs={'mdtfile': 'File'},
      outputs={'mol': 'out.pkl'},
      label='strip nonprotein residues')
def isolate_protein(mdtfile):
    import moldesign as mdt

    mol = mdt.read(mdtfile)
    newmol = mdt.Molecule([atom for atom in mol.atoms if atom.residue.type == 'protein'])
    newmol.write('out.pkl')


@task(inputs={'mdtfile':'File'},
      outputs={'mol': 'out.pkl'},
      label='Assign histidine states')
def guess_histidine_states(mdtfile):
    import moldesign as mdt

    mol = mdt.read(mdtfile)
    mdt.guess_histidine_states(mol)
    mol.write('out.pkl')


@task(inputs={'mdtfile':'File'},
      outputs={'mol': 'out.pkl'},
      label='Assign amber14 forcefield')
def assign_amber16_forcefield(mdtfile):
    import moldesign as mdt

    mol = mdt.read(mdtfile)
    newmol = mdt.assign_forcefield(mol)
    newmol.write('out.pkl')


@task(inputs={'mdtfile1':'File', 'mdtfile2':'File'},
      outputs={'mol': 'out.pkl'},
      label='Assign histidine states')
def combine_molecules(mdtfile1, mdtfile2):
    import moldesign as mdt

    m1 = mdt.read(mdtfile1)
    m2 = mdt.read(mdtfile2)
    newmol = mdt.Molecule(m1.atoms + m2.atoms)
    newmol.write('out.pkl')

    
@task(inputs={'mdtfile': 'File'},
      outputs={'result': 'energy.json',
               'doublet_min': 'min.pkl'},
      label='Calculate vertical detachment energy to neutralize a doublet anion')
def vertical_detachment_energy(mdtfile):
    import moldesign as mdt

    mol = mdt.read(mdtfile)

    # anion doublet minimization
    mol.charge = -1 * mdt.units.q_e
    mol.set_energy_model(mdt.models.NWChemQM,
                         basis='sto-3g', theory='uks', multiplicity=2)

    minimization = mol.minimize(nsteps=40)
    minimization.write('min.pkl')
    mol.write('min.pdb')
    e_anion = mol.potential_energy

    # neutral calc
    mol.charge = 0 * mdt.units.q_e
    mol.energy_model.params.theory = 'rks'
    mol.energy_model.params.multiplicity = 1
    neutral = mol.calculate(use_cache=True)  # shouldn't have to do the cache thing ...
    e_neutral = neutral.potential_energy

    result = e_anion - e_neutral

    with open('energy.json', 'w') as outfile:
        json.dump({'value': result.value_in(mdt.units.eV),
                   'units': 'eV'},
                  outfile)


if __name__ == '__main__':
    arg = sys.argv[1]

    if arg == '--writenodes':
        if not os.path.exists('nodes'):
            os.mkdir('nodes')

        for name in tasklist:
            with open('nodes/%s.cwl' % name, 'w') as outfile:
                yaml.dump(tasklist[name], outfile)

    else:
        funcname = sys.argv[1]
        locals()[funcname](*sys.argv[2:])


        
