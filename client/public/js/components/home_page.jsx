import React from 'react';
import WorkflowCard from './workflow_card';
import WorkflowRecord from '../records/workflow_record';
import imgLogo from '../../img/logo.png';
import imgM1 from '../../img/m1.png';
import imgM2 from '../../img/m2.png';
import imgM3 from '../../img/m3.png';
import imgM4 from '../../img/m4.png';
import imgLogo1 from '../../img/logo1.png';
import imgLogo2 from '../../img/logo2.png';
import imgLogo3 from '../../img/logo3.png';
import imgLogo4 from '../../img/logo4.png';
import imgLogoResearch from '../../img/logo_research.png';
import imgTweet from '../../img/tweet.svg';
import imgFace from '../../img/face.svg';
import '../../css/home_page.scss';

// TODO this should come from an ajax request
const workflows = [
  new WorkflowRecord({
    id: '0',
    title: 'Ligand binding site refinement',
    bgIndex: 0,
    bgColor: '#3762E9',
    color: '#F1FF66',
    comingSoon: false,
    creatorImage: imgLogo1,
    description: "Refine the geometry of a protein/small molecule binding site using QM/MM",
    runs: 124,
    views: 737,
  }),
  new WorkflowRecord({
    id: '0',
    title: 'Vertical detachment energy',
    bgColor: '#292E60',
    bgIndex: 1,
    color: '#2FE695',
    comingSoon: false,
    creatorImage: imgLogo2,
    description: 'Calculate the electron binding energy of an anionic doublet species using DFT',
    runs: 124,
    views: 737,
  }),
  new WorkflowRecord({
    id: '0',
    title: 'Perceived color and UV-Viz spectrum',
    bgColor: '#42413F',
    bgIndex: 2,
    color: '#FFFFFF',
    comingSoon: true,
    creatorImage: imgLogo3,
    description: "Predict a small molecule's perceived color and its UV-Viz spectra using TD-DFT",
    runs: 124,
    views: 737,
  }),
  new WorkflowRecord({
    id: '0',
    title: 'Solvation free energy', // see http://www.alchemistry.org/wiki/Example:_Absolute_Solvation_Free_Energy
    bgColor: '#DE2755',
    bgIndex: 3,
    color: '#FFFFFF',
    comingSoon: true,
    creatorImage: imgLogo4,
    description: "Predict the solvation free energy of a small molecule in water using thermodynamic integration",
    runs: 124,
    views: 737,
  }),
];

function HomePage() {
  return (
    <div className="home-page">
      <nav
        className="navbar navbar-default navbar-fixed-top"
        role="navigation"
      >
        <div className="container-fluid">
          <div className="navbar-header page-scroll">
            <button type="button" className="navbar-toggle" >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar" />
              <span className="icon-bar" />
              <span className="icon-bar" />
            </button>
            <a className="navbar-brand page-scroll" href="#heroSection">
              <img src={imgLogo} alt="logo" width="30px" />
            </a>
          </div>
          <div className="collapse navbar-collapse navbar-ex1-collapse">
            <ul className="nav navbar-nav">
              <li>
                <a href="#heroSection">Home</a>
              </li>
              <li>
                <a href="#aboutSection">About</a>
              </li>
              <li>
                <a href="#joinSection">Join Us</a>
              </li>
              <li>
                <a href="#contactSection">Contact</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="heroSection">
        <img className="m3" alt="hero" src={imgM3} />
        <img className="m4" alt="hero" src={imgM4} />
        <img className="m2" alt="hero" src={imgM2} />
        <img className="m1" alt="hero" src={imgM1} />
        <div className="heroText heroTextXS" >
          <h1 className="h1XS colorLight">Molecular Simulation Tools</h1>
          <h2 className="colorHighlight">Run and share molecular simulations</h2>
          <div>
            <img className="socialIcon" alt="Tweet" src={imgTweet} />
            <img className="socialIcon" alt="Share on Facebook" src={imgFace} />
          </div>
        </div>
      </div>
      <div className="toolsCardSection">
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <h3>LATEST TOOLS</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12 col-sm-8">
              <h4 className="colorGrey">Molecular simulations running in the cloud</h4>
            </div>
          </div>
          <div className="row" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            {
              workflows.map((workflow, index) =>
                <WorkflowCard
                  bgIndex={workflow.bgIndex}
                  bgColor={workflow.bgColor}
                  color={workflow.color}
                  comingSoon={workflow.comingSoon}
                  creatorImage={workflow.creatorImage}
                  id={workflow.id}
                  key={index}
                />
              )
            }
          </div>
        </div>
      </div>
      <div className="aboutSection">
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <h3 >ABOUT</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12 col-sm-8">
              <h4 >We are creating a toolbox of powerful modeling tools</h4>
            </div>
          </div>
          <div className="row" style={{ paddingTop: '40px' }}>
            <div className="col-xs-12 col-sm-4" >
              <p>
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
                Aenean commodo ligula eget dolor. Aenean massa. Cum sociis
                natoque penatibus et magnis dis parturient montes, nascetur
                ridiculus mus. Donec quam felis, ultricies nec, pellentesque
                eu, pretium quis, sem. Nulla consequat massa quis enim. Donec
                pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.
                In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.
                Nullam dictum felis eu pede mollis pretium.
              </p>
            </div>
            <div className="col-xs-12 col-sm-4">
              <p>
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
                Aenean commodo ligula eget dolor. Aenean massa. Cum sociis
                natoque penatibus et magnis dis parturient montes, nascetur
                ridiculus mus. Donec quam felis, ultricies nec, pellentesque
                eu, pretium quis, sem. Nulla consequat massa quis enim. Donec
                pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.
                In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.
                Nullam dictum felis eu pede mollis pretium.
              </p>
            </div>
            <div className="col-xs-12 col-sm-4">
              <p>
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
                Aenean commodo ligula eget dolor. Aenean massa. Cum sociis
                natoque penatibus et magnis dis parturient montes, nascetur
                ridiculus mus. Donec quam felis, ultricies nec, pellentesque
                eu, pretium quis, sem. Nulla consequat massa quis enim. Donec
                pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.
                In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.
                Nullam dictum felis eu pede mollis pretium.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="joinSection">
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <h3>JOIN US</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12 col-sm-8">
              <h4>
                Our fantastic developer community is developing powerfull
                modeling tools. Come and join us!
              </h4>
            </div>
            <div className="col-sm-4 col-xs-6 creator-images">
              {
                workflows.map((workflow, index) => (
                  <img
                    key={index}
                    src={workflow.creatorImage}
                    alt="creator example"
                    className="creator-image"
                    style={{ paddingTop: '20px' }}
                  />
                ))
              }
            </div>
          </div>
          <div className="row" style={{ paddingTop: '40px' }}>
            <div className="col-xs-12 col-sm-4">
              <p>
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
                Aenean commodo ligula eget dolor. Aenean massa. Cum sociis
                natoque penatibus et magnis dis parturient montes, nascetur
                ridiculus mus. Donec quam felis, ultricies nec, pellentesque
                eu, pretium quis, sem. Nulla consequat massa quis enim.
                Donec pede justo, fringilla vel, aliquet nec, vulputate eget,
                arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae,
                justo. Nullam dictum felis eu pede mollis pretium.
              </p>
            </div>
            <div className="col-xs-12 col-sm-4">
              <p>
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
                Aenean commodo ligula eget dolor. Aenean massa. Cum sociis
                natoque penatibus et magnis dis parturient montes, nascetur
                ridiculus mus. Donec quam felis, ultricies nec, pellentesque
                eu, pretium quis, sem. Nulla consequat massa quis enim. Donec
                pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.
                In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.
                Nullam dictum felis eu pede mollis pretium.
              </p>
            </div>
            <div className="col-xs-12 col-sm-4">
              <p>
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
                Aenean commodo ligula eget dolor. Aenean massa. Cum sociis
                natoque penatibus et magnis dis parturient montes, nascetur
                ridiculus mus. Donec quam felis, ultricies nec, pellentesque
                eu, pretium quis, sem. Nulla consequat massa quis enim. Donec
                pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.
                In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.
                Nullam dictum felis eu pede mollis pretium.
              </p>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12 col-sm-4 text-left">
              <button type="button" className="contactButton">Contact Us</button>
            </div>
          </div>
        </div>
      </div>
      <div className="contactSection">
        <div className="container">
          <div className="row">
            <div className="col-sm-4" style={{ paddingBottom: '60px' }}>
              <div className="line" />
              <p><b className="footerLink">Contact us</b></p>
              <a href="mailto:contact.bionano@autodesk.com" className="footerLink">
                Contact.BioNano@Autodesk.com
              </a>
            </div>
            <div className="col-sm-4" style={{ paddingBottom: '60px' }}>
              <div className="line" />
              <p><b className="footerLink">More Info</b></p>
              <a href="https://www.autodeskresearch.com" className="footerLink">Autodesk Research<br /></a>
              <a href="https://forum.bionano.autodesk.com" className="footerLink">BioNano Forum<br /></a>
              <a href="http://autodeskbionano.blogspot.com/" className="footerLink">BioNano Blog<br /></a>
            </div>
            <div className="col-sm-4" style={{ paddingBottom: '60px' }}>
              <div className="line" />
              <p><b className="footerLinks">Legal</b></p>
              <a href="http://www.autodesk.com/company/legal-notices-trademarks/privacy-statement" className="footerLink"><span className="footerLinks">Privacy</span></a>
              <p className="footerLinks">© 2016 Autodesk Research</p>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-4" style={{ paddingBottom: '60px' }}>
              <img src={imgLogoResearch} alt="logo" width="150px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
