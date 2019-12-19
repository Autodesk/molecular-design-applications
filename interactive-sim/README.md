# Autodesk Interactive Simulation  

see [LAMMPS](http://lammps.sandia.gov/doc/Manual.html) for the powerful underlying software 
see [Emscripten](http://kripken.github.io/emscripten-site/) to find out how we brought C++ into the web  

> Welcome to Interactive Simulation web page developed by Autodesk's Life Sciences group. This webpage allows powerful simulation tool to run on your browser on-the-go. You no longer need to install the tools on your computer to run molecular dynamics. The webpage allows you to run complicated simulations on your browser with just a button click.  


<br />
The documentation describes the improtant files in this project as well as guidelines for development  

<br />
## How do I use the Interactive Simulation Page?  
<br />

1. Click on one of the buttons to load the desired molecule
![alt text][loadMolecule]  

2. Wait for molecule to load.
![alt text][waitForLoad]  

3. You can change the various settings of the simulation. Ensure to click on the 'Apply Settings' button to ensure the changes are applied.
![alt text][simulationSettings]  

4. To interact with the molecule, set the appropitate displacement/force vector and click on the part of the molecule you want to pull/drag.
![alt text][interactWithMolecule]  

5. Pause/Play Simulation by pressing the `spacebar` on the keyboard or clicking on the pause/play button.
![alt text][togglePause]  

6. Take a snapshot of the current state by pressing `p` on the keyboard or clicking on the Save Snapshot button. You can load the snapshot at any time during the simulation by clicking on the saved snapshot instances.
![alt text][saveSnapshots]  

[loadMolecule]: common/loadMolecule.png "Load Molecule"

[waitForLoad]: common/waitForLoad.png "Wait For Load"

[simulationSettings]: common/simulationSettings.png "Simulation Settings"

[interactWithMolecule]: common/interactWithMolecule.png "Interact With Molecule"

[togglePause]: common/togglePause.png "Toggle Pause"

[saveSnapshots]: common/saveSnapshots.png "Save Snapshots"  

<br /><br />
## Interactive Simulation Development 

> Want to join in developing the backend for this project? Please visit our [Lammps-browser repository](http://git.autodesk.com/t-leeday/lammps-browser) to build the C++ backbone for this webpage.  

<br />
Before you join the development team of the web page, there are a few important files and directories you need to know as well as external repositories that are needed for constructing the backbone of the application.  

<br />
### lammps/  

<br/>
__`emscripten.*`__: emscripten-generated files from the [the lammps repository](https://git.autodesk.com/t-leeday/lammps-browser)  

__`worker.js`__: Web worker script that deals with C++ objects and functions via `Module` object  

<br />
Emscripten-generated Lammps-browser code runs in a webworker thread. This is because we don't want the UI (input boxes, buttons, _MolViewer_ to get blocked by the simulation that's running in the background.  

  

<br/>
__Web Worker__ message protocol is used for communication between the main thread (`/js/*.js`, etc...) and the worker thread (`/lammps/*.js`):  
* The main thread _(/js/index.js)_ initiates the worker with the `new Worker("../lammmps/worker.js")` call and defines `.onmessage` callback function. The callback function defines what the main thread will do on a specific message sent __from the worker thread__.  

* The worker thread _(/lammps/worker.js)_ imports all the scripts that are necessary (i.e. /js/constant.js and /lammps/emscripten.\*). It also defines the `.onmessage` callback function to define what it should do on a specific message sent __from the main thread__.  

* The .onmessage callback function in both the main thread and the worker thread have a `switch case` statement to deal with messages with different titles.  

* `/js/constant.js` file defines all the constants (i.e. message title) that are commonly used between the main thread and the worker thread. Having all the global constants defined reduces risks of error due to typo in message title. It also defines the global `Module` variable that is used by the __emscripten-generated JS files__.  

  

<br />
Other resources that are important to the development of this web application are:
> * [Emscripten embind documentation](https://kripken.github.io/emscripten-site/docs/porting/connecting_cpp_and_javascript/embind.html) for information on binding C++ functions and classes to JavaScript.
* [lammps-browser](https://git.autodesk.com/t-leeday/lammps-browser) github repository for developemnt on the C++ side, thus binding JavaScript functions to C++.  
* [mozilla documentation on webworker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) for the basic understanding of webworkers.  

<br />
### js/
<br />
__`demo.js`__: contains variables for demo molecule

__`constant.js`__: contains constants that are used the main thread and the worker thread

__`global.js`__: contains global variables (used for maintaing simulation settings) that are used by _viewer.js_ and _index.js_

__`index.js`__: main JavaScript that spawns the lammps webworker

__`viewer.js`__: JS for viewer-related scripts (i.e. loading molecule, getting user interaction, etc)  

