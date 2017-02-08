Autodesk = window.Autodesk || {};
Autodesk.Nano = Autodesk.Nano || {};
Autodesk.Nano.MODEL_START_LOADED_EVENT = "Nano.ModelStartlLoaded";
Autodesk.Nano.MODEL_LOAD_ERROR_EVENT = "Nano.ModelLoadedError";
Autodesk.Nano.MODEL_END_LOADED_EVENT = "Nano.ModelEndLoaded";
Autodesk.Nano.MODEL_ADDED_EVENT = "Nano.ModelAdded";
Autodesk.Nano.MODEL_DELETED_EVENT = "Nano.ModelDeleted";
Autodesk.Nano.METADATA_LOADED_EVENT = "Nano.MetaDataLoaded";
Autodesk.Nano.INSTANCE_ADDED_EVENT = "Nano.InstanceAdded";
Autodesk.Nano.INSTANCE_DELETED_EVENT = "Nano.InstanceDeleted";
Autodesk.Nano.INSTANCES_CHANGED_EVENT = "Nano.InstancesChanged";
Autodesk.Nano.INSTANCE_SELECTION_CHANGED_EVENT = "Nano.InstanceSelected";
Autodesk.Nano.INSTANCE_SELECTION_CLEARED_EVENT = "Nano.InstanceCleared";
Autodesk.Nano.INSTANCES_SET_SELECTION_CHANGED_EVENT = "Nano.InstancesSelectionChanged";
Autodesk.Nano.SESSION_SAVED_EVENT = "SessionSaved";
Autodesk.Nano.SESSION_LOADED_EVENT = "SessionLoaded"; //called after all models are loaded.
Autodesk.Nano.OPACITY_SET_EVENT = "OpacitySet";
Autodesk.Nano.STATUS_UPDATE = "Nano.StatusUpdate";

;/**
 * Created by andrewkimoto on 3/21/16.
 */

//ApiConnector object - put all calls the the REST API here...

Autodesk.Nano.ApiConnector = function ApiConnector(app) {
    //temporary hack since Nanodesign still uses globals
    if (app) {
        this.app = app;
    } else {
        this.app = {Loader: Loader};
    }

};

// Info on the parameters
// https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
Autodesk.Nano.ApiConnector.prototype.setCookieItem =  function setCookieItem(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
        switch (vEnd.constructor) {
            case Number:
                sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                break;
            case String:
                sExpires = "; expires=" + vEnd;
                break;
            case Date:
                sExpires = "; expires=" + vEnd.toUTCString();
                break;
        }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) +
        sExpires + (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
};

Autodesk.Nano.ApiConnector.prototype.getCookieItem = function getCookieItem(sKey) {
    if (!sKey) {
        return null;
    }
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" +
            encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
            "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
};


Autodesk.Nano.ApiConnector.prototype.verifyFile = function verifyFile(file) {
    var self = this;
    var callID = this.createCallID();
    console.log('verifyFile Socket-ID is ',callID);
    return new Promise(function(resolve,reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', file, true);
        xhr.setRequestHeader("Connection-ID", self.app.Loader.getConnectionID());
        xhr.setRequestHeader("Socket-ID", callID);
        xhr.setRequestHeader("Stack-Trace", 'ApiConnector.verifyFile');
        xhr.onload = function(e) {
            if(e.currentTarget.status === 200){
                resolve(file);
            } else {
                reject(new Error('could not find svf'));
            }
        };
        xhr.onerror = function(err) {
            console.log('there was an error');
            reject(err);
        };
        xhr.send();
    });
};

Autodesk.Nano.ApiConnector.prototype.getCifUrl = function getgetCifUrl(md5, socketID,stackTrace) {
    var self = this;
    return new Promise(function(resolve,reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', '/cifurl/' + md5, true);
        xhr.setRequestHeader("Connection-ID", self.app.Loader.getConnectionID());
        xhr.setRequestHeader("Stack-Trace", 'ApiConnector.getCifUrl');
        if (socketID) {
            xhr.setRequestHeader("Socket-ID", socketID);
        }
        xhr.onload = function(e) {
            if(e.currentTarget.status === 200){
                resolve(e.currentTarget.response);
            } else {
                reject(new Error('could not find svf'));
            }
        };
        xhr.onerror = function(err) {
            console.log('there was an error');
            reject(err);
        };
        xhr.send();
    })
        .then(function successFunc(data){
            var oData = JSON.parse(data);
            return oData.url;
        }, function errorFunc(error) {
            return error;
        });
};

Autodesk.Nano.ApiConnector.prototype.getPdbUrl = function getPdbUrl(id, socketID) {
    var self = this;
    return new Promise(function(resolve,reject) {
        var callID = self.createCallID();
        console.log('getPdbUrl Socket-ID is ',callID);
        var xhr = new XMLHttpRequest();

        xhr.open('GET', '/pdb/' + id, true);
        xhr.setRequestHeader("Connection-ID", self.app.Loader.getConnectionID());
        xhr.setRequestHeader("Stack-Trace", 'ApiConnector.getPdbUrl');
        if (socketID) {
            xhr.setRequestHeader("Socket-ID", socketID);
        }
        xhr.onload = function(e) {
            if (this.status == 200) {
                var data = JSON.parse(e.currentTarget.response);
                //Handle the case of an error
                if (data.error != null) {
                    console.error(data);
                    reject(false);
                } else {
                    //else we assume there is a valid url
                    resolve(data);
                }
            } else {
                console.log('error ',this.status);
                reject(false);
            }
        };
        xhr.send();
    });

};


Autodesk.Nano.ApiConnector.prototype.getCifMD5 = function getCifMD5(md5, socketID) {
    var self = this;
    return new Promise(function(resolve,reject) {
        var callID = self.createCallID();
        console.log('getCifMD5 Socket-ID is ',callID);
        var xhr = new XMLHttpRequest();

        xhr.open('GET', '/cifmd5/' + md5, true);
        xhr.setRequestHeader("Connection-ID", self.app.Loader.getConnectionID());
        xhr.setRequestHeader("Stack-Trace", 'ApiConnector.getCifMD5');
        if (socketID) {
            xhr.setRequestHeader("Socket-ID", socketID);
        }
        xhr.onload = function(e) {
            if (this.status == 200) {
                var data = JSON.parse(e.currentTarget.response);
                //Handle the case of an error
                if (data.error != null) {
                    console.error(data);
                    reject(false);
                } else {
                    //else we assume there is a valid url
                    resolve(data);
                }
            } else {
                console.log('error ',this.status);
                reject(false);
            }
        };
        xhr.send();
    });

};

Autodesk.Nano.ApiConnector.prototype.loadMetadata = function loadMetadata(molModel,url,md5) {
    if(url && md5) {
        molModel.viewer.fireEvent({type: Autodesk.Nano.STATUS_UPDATE, method: 'showCustomMessage', message: 'Loading Metadata...'});

        molModel.modelIsLoaded = false;

        molModel.viewer.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT,molModel.modelRootLoadedBind);
        molModel.viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, molModel.geometryLoadedBind);

        var headerFiles = [];
        headerFiles.push('atomMetadata.json');
        headerFiles.push('positions.json');
        headerFiles.push('assemblies.json');
        headerFiles.push('residues.json');
        headerFiles.push('entities.json');
        headerFiles.push('chains.json');
        headerFiles.push('header.json');

        var promises = [];
        var promise;
        for (var i in headerFiles) {
            promise = molModel.getJSON(url,headerFiles[i]);
            promises.push(promise);
        }
        var allMetadata = function(results) {
            for(var i =0;i< results.length;++i){
                var res = JSON.parse(results[i].response);
                var info  = res.theArray;

                var str = results[i].title.split('.');
                molModel[str[0]] = info;
            }

        };
        allMetadata = allMetadata.bind(molModel);

        var setUpMetadata = function() {
            molModel.setUpAfterMetadataLoaded();
            //molModel.viewer.fireEvent({type: Autodesk.Nano.METADATA_LOADED_EVENT,model: molModel,modelType: 'mol'});
            molModel.viewer.fireEvent({type: Autodesk.Nano.STATUS_UPDATE, method: 'showCustomMessage', message: 'Waiting for Next Translation'});
            molModel.readySocket(md5);

        };

        setUpMetadata = setUpMetadata.bind(molModel);
        Promise.all(promises).then(allMetadata)
            .then(setUpMetadata)
            .catch(function(error) {
                molModel.modelIsLoaded = false;
                molModel.viewer.fireEvent({type: Autodesk.Nano.MODEL_LOAD_ERROR_EVENT,what:'metadata',error:error,model: molModel});
                console.log(error);
            });
    }

};


Autodesk.Nano.ApiConnector.prototype.getUrlFromPdbId = function getUrlFromPdbId(id, socketID) {
    var self = this;
    return new Promise(function(resolve,reject) {
        var results = self.getPdbUrl(id, socketID);
        results
            .then(function(data){
                if (data) {
                    resolve(data);
                } else {
                    reject(data);
                }
            })
            .catch(function(err){
                console.log('Error getting PDB URL from server: ',err);
            });
    });
};



//
Autodesk.Nano.ApiConnector.prototype.saveSession = function saveSession() {
    var self = this;

    var stateObj = self.app.MolMan.saveSessionState();

    var pPromise = new Promise(function(resolve,reject) {
        var stateJSON = JSON.stringify(stateObj);
        var compressedState = LZString144.compressToEncodedURIComponent(stateJSON);
        var formData = new FormData();
        var callID = self.createCallID();
        console.log('saveSession Socket-ID is ',callID);

        formData.append("statejson", compressedState);
        var xhr = new XMLHttpRequest();

        xhr.open('POST', '/savesession/', true);
        xhr.setRequestHeader("Connection-ID", self.app.Loader.getConnectionID());
        xhr.setRequestHeader("Socket-ID", callID);
        xhr.setRequestHeader("Stack-Trace", 'ApiConnector.saveSession');
        xhr.onload = function (e) {
            var aData;
            if (this.status == 200) {
                var data = JSON.parse(e.currentTarget.response);
                 //Handle the case of an error
                if (data.error != null) {
                    console.error(data);
                    reject(data);
                } else {
                    //else we assume there is a valid url
                    resolve(data.uuid);
                }
            } else {
                console.log('error ', this.status);
                reject(new Error("Status code " + this.status));
            }
        };
        xhr.send(formData);
    }).then(function(id) {
            var finalUrl = self.app.MolViewer.buildSessionUrl(id);
            //using events here; more than element/view will be listening to this
            self.app.MoleculeViewer.fireEvent({type: Autodesk.Nano.SESSION_SAVED_EVENT, id: id, url: finalUrl});
        }).catch(function(err) {
            console.error('There was an error saving the session:',err);
        });
};

Autodesk.Nano.ApiConnector.prototype.loadSession = function loadSession(id) {
    var self = this;
    return new Promise(function(resolve,reject) {
        var callID = self.createCallID();
        console.log('ApiConnector.loadSession Socket-ID is ',callID);
        var xhr = new XMLHttpRequest();

        xhr.open('GET', '/loadsession/' + id, true);
        xhr.setRequestHeader("Connection-ID", self.app.Loader.getConnectionID());
        xhr.setRequestHeader("Socket-ID", callID);
        xhr.setRequestHeader("Stack-Trace", 'ApiConnector.loadSession');
        xhr.onload = function(e) {
            if (this.status == 200) {
                var data = JSON.parse(LZString144.decompressFromEncodedURIComponent(e.currentTarget.response));
                if(!data){
                    //ok will be an old session
                    data = JSON.parse(decodeURI(e.currentTarget.response));
                }
                //Handle the case of an error
                if (!data || data.error != null) {
                    console.error(data);
                    reject(false);
                } else {
                    //else we assume there is a valid url
                    resolve(data);
                }
            } else {
                console.error('error ',this.status);
                reject(new Error("Error code: " + this.status));
            }
        };
        xhr.send();
    });
};

Autodesk.Nano.ApiConnector.prototype.saveGallery = function saveGallery(galleryObj) {
    var self = this;
    return new Promise(function(resolve,reject) {
        var galleryJSON = JSON.stringify(galleryObj);
        var formData = new FormData();
        var callID = self.createCallID();
        console.log('saveGallery Socket-ID is ',callID);
        formData.append("statejson", galleryJSON);
        var xhr = new XMLHttpRequest();

        xhr.open('POST', '/savesession/', true);
        xhr.setRequestHeader("Connection-ID", self.app.Loader.getConnectionID());
        xhr.setRequestHeader("Socket-ID", callID);
        xhr.setRequestHeader("Stack-Trace", 'ApiConnector.saveGallery');
        xhr.onload = function (e) {
            var aData;
            if (this.status == 200) {
                var data = JSON.parse(e.currentTarget.response);
                //Handle the case of an error
                if (data.error != null) {
                    console.error(data);
                    reject(data);
                } else {
                    //else we assume there is a valid url
                    resolve(data.uuid);
                }
            } else {
                console.log('error ', this.status);
                reject(new Error("Status code " + this.status));
            }
        };
        xhr.send(formData);
    });

};

Autodesk.Nano.ApiConnector.prototype.loadViewData = function loadViewData(options,viewFile) {
    var _that = this;

    return new Promise(function(resolve,reject) {
        var callID = _that.createCallID();
        if (options.topViews) {
            viewFile = 'https://d2gqcyogkbv0l5.cloudfront.net/cdd0cfb/molviewer/config/' + options.topViews + (!options.topViews.match(/\.json$/) ? '.json' : '');
        }

        console.log('ApiConnector.loadViewData Socket-ID is ',callID);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', viewFile, true);
        xhr.setRequestHeader("Connection-ID", _that.app.Loader.getConnectionID());
        xhr.setRequestHeader("Socket-ID", callID);
        xhr.setRequestHeader("Stack-Trace", 'ApiConnector.loadViewData');
        xhr.onload = function(e) {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(e);

            }
        };
        xhr.send();
    });
};


// For uploading string data
// TODO create upload_cif_string endpoint in server.js to work with this
// Need to get the data and write it to the upload directory
Autodesk.Nano.ApiConnector.prototype.uploadCIF = function uploadCIF(cifData) {
    var formData = new FormData();
    var self = this;
    if (this.app.ViewManager) {
        var sv = this.app.ViewManager.getTopView('StatusView');
        sv.showTranslating();
    }

    formData.append("cif",cifData);

    var protocol = window.location.protocol;

    var translatorURL = '/upload_cif_string';
    var data = {};
    var url = '';
    var xhr = new XMLHttpRequest();

    xhr.open('POST', translatorURL, true);
    xhr.setRequestHeader("Connection-ID", this.app.Loader.getConnectionID());
    xhr.onload = function(e) {
        var sv = null;
        var hv = null;
        if (self.app.ViewManager) {
            sv = self.app.ViewManager.getTopView('StatusView');
            hv = self.app.ViewManager.getTopView('HeaderView');
        }

        var aData;
        if (self.status == 200) {
            data = JSON.parse(e.currentTarget.response);
            if (data.md5) {
                self.molViewer.resetViewer(); //eventually we will just remove the model here.
                self.molMan.createMolModel(null,data.url,data.md5);
            } else {
                if (sv) {
                    sv.showError();
                }
            }
            if (hv) {
                hv.hideMenus();
            }

        } else {
            if (sv) {
                sv.showError();
            }
            if (hv) {
                hv.hideMenus();
            }

            console.log('error ',this.status);
        }
    };
    xhr.send(formData);
};



// progeny of loader can override this method to display error messages in a custom way
Autodesk.Nano.ApiConnector.prototype.displayError = function displayError(msg) {
    var errorDialog,
        dialogDiv,
        dialog,
        messageDiv;

    if(typeof this.app.ViewManager === 'undefined') { // we need to build the error dialog manually since none of the views are loaded yet
        dialogDiv = document.createElement('div');
        dialogDiv.setAttribute('class','dialogLayer');
        dialog = document.createElement('div');
        dialog.setAttribute('id','dialogDiv');
        dialog.setAttribute('style','height: 140px; width: 550px; top: calc(50% - 70px); left: calc(50% - 275px);background-color: rgba(255,255,255,0.8)');
        messageDiv = document.createElement('div');
        messageDiv.setAttribute('style','width:100%;margin: 10px;font-family:helvetics,sans-serif;box-sizing: border-box');
        messageDiv.innerHTML='<h2 style="color:#cd0000;text-align:center;margin-top:20px;">Error Loading Session</h2><p style="margin-top:20px;color:#333;text-align:center;">' + msg.replace(/\. /,'.<br>') +'</p>';
        dialog.appendChild(messageDiv);
        dialogDiv.appendChild(dialog);
        document.body.appendChild(dialogDiv);
    } else {
        this.app.ViewManager.getTopView('StatusView').showCustomError(msg);
    }

};

Autodesk.Nano.ApiConnector.prototype.createCallID = function createCallID() {
    return THREE.Math.generateUUID();
};
;/*
 * BioJava development code
 *
 * This code may be freely distributed and modified under the
 * terms of the GNU Lesser General Public Licence. This should
 * be distributed with the code. If you do not have a copy,
 * see:
 *
 * http://www.gnu.org/copyleft/lesser.html
 *
 * Copyright for this code is held jointly by the individual
 * authors. These should be listed in @author doc comments.
 *
 * For more information on the BioJava project and its aims,
 * or to join the biojava-l mailing list, visit the home page
 * at:
 *
 * http://www.biojava.org/
 *
 * This code was contributed from the Molecular Biology Toolkit
 * (MBT) project at the University of California San Diego.
 *
 * Please reference J.L. Moreland, A.Gramada, O.V. Buzko, Qing
 * Zhang and P.E. Bourne 2005 The Molecular Biology Toolkit (MBT):
 * A Modular Platform for Developing Molecular Visualization
 * Applications. BMC Bioinformatics, 6:21.
 *
 * The MBT project was funded as part of the National Institutes
 * of Health PPG grant number 1-P01-GM63208 and its National
 * Institute of General Medical Sciences (NIGMS) division. Ongoing
 * development for the MBT project is managed by the RCSB
 * Protein Data Bank(http://www.pdb.org) and supported by funds
 * from the National Science Foundation (NSF), the National
 * Institute of General Medical Sciences (NIGMS), the Office of
 * Science, Department of Energy (DOE), the National Library of
 * Medicine (NLM), the National Cancer Institute (NCI), the
 * National Center for Research Resources (NCRR), the National
 * Institute of Biomedical Imaging and Bioengineering (NIBIB),
 * the National Institute of Neurological Disorders and Stroke
 * (NINDS), and the National Institute of Diabetes and Digestive
 * and Kidney Diseases (NIDDK).
 *
 * Created on 2011/11/08
 *
 * Ported into JavaScript by Andrew Kimoto, Autodesk Inc 03/31/2015
 *
 * Note that the functionality of java.awt.Color has been taken over
 * by the Color object in this port
 */

/**
 *  The ColorBrewer constructor
 *  @constructor
 *
 *  @property {object} palettes - palettes object.
 */
ColorBrewer = function() {

    this.palettes = {
        BrBG: {paletteType: 1, paletteDescription: "Brown-Blue-Green", colorBlindSafe: true, hexColors: [
            ["#D8B365"],
            ["#D8B365", "#5AB4AC"],
            ["#D8B365", "#F5F5F5", "#5AB4AC"],
            ["#A6611A", "#DFC27D", "#80CDC1", "#018571"],
            ["#A6611A", "#DFC27D", "#F5F5F5", "#80CDC1", "#018571"],
            ["#8C510A", "#D8B365", "#F6E8C3", "#C7EAE5", "#5AB4AC", "#01665E"],
            ["#8C510A", "#D8B365", "#F6E8C3", "#F5F5F5", "#C7EAE5", "#5AB4AC", "#01665E"],
            ["#8C510A", "#BF812D", "#DFC27D", "#F6E8C3", "#C7EAE5", "#80CDC1", "#35978F", "#01665E"],
            ["#8C510A", "#BF812D", "#DFC27D", "#F6E8C3", "#F5F5F5", "#C7EAE5", "#80CDC1", "#35978F", "#01665E"],
            ["#543005", "#8C510A", "#BF812D", "#DFC27D", "#F6E8C3", "#C7EAE5", "#80CDC1", "#35978F", "#01665E", "#003C30"],
            ["#543005", "#8C510A", "#BF812D", "#DFC27D", "#F6E8C3", "#F5F5F5", "#C7EAE5", "#80CDC1", "#35978F", "#01665E", "#003C30"]
        ]},
        PiYG: {paletteType: 1, paletteDescription: "Magenta-Yellow-Green", colorBlindSafe: true, hexColors: [
            ["#E9A3C9"],
            ["#E9A3C9", "#A1D76A"],
            ["#E9A3C9", "#F7F7F7", "#A1D76A"],
            ["#D01C8B", "#F1B6DA", "#B8E186", "#4DAC26"],
            ["#D01C8B", "#F1B6DA", "#F7F7F7", "#B8E186", "#4DAC26"],
            ["#C51B7D", "#E9A3C9", "#FDE0EF", "#E6F5D0", "#A1D76A", "#4D9221"],
            ["#C51B7D", "#E9A3C9", "#FDE0EF", "#F7F7F7", "#E6F5D0", "#A1D76A", "#4D9221"],
            ["#C51B7D", "#DE77AE", "#F1B6DA", "#FDE0EF", "#E6F5D0", "#B8E186", "#7FBC41", "#4D9221"],
            ["#C51B7D", "#DE77AE", "#F1B6DA", "#FDE0EF", "#F7F7F7", "#E6F5D0", "#B8E186", "#7FBC41", "#4D9221"],
            ["#8E0152", "#C51B7D", "#DE77AE", "#F1B6DA", "#FDE0EF", "#E6F5D0", "#B8E186", "#7FBC41", "#4D9221", "#276419"],
            ["#8E0152", "#C51B7D", "#DE77AE", "#F1B6DA", "#FDE0EF", "#F7F7F7", "#E6F5D0", "#B8E186", "#7FBC41", "#4D9221", "#276419"]
        ]},
        PRGn: {paletteType: 1, paletteDescription: "Purple-Red-Green", colorBlindSafe: true, hexColors: [
            ["#AF8DC3"],
            ["#AF8DC3", "#7FBF7B"],
            ["#AF8DC3", "#F7F7F7", "#7FBF7B"],
            ["#7B3294", "#C2A5CF", "#A6DBA0", "#008837"],
            ["#7B3294", "#C2A5CF", "#F7F7F7", "#A6DBA0", "#008837"],
            ["#762A83", "#AF8DC3", "#E7D4E8", "#D9F0D3", "#7FBF7B", "#1B7837"],
            ["#762A83", "#AF8DC3", "#E7D4E8", "#F7F7F7", "#D9F0D3", "#7FBF7B", "#1B7837"],
            ["#762A83", "#9970AB", "#C2A5CF", "#E7D4E8", "#D9F0D3", "#A6DBA0", "#5AAE61", "#1B7837"],
            ["#762A83", "#9970AB", "#C2A5CF", "#E7D4E8", "#F7F7F7", "#D9F0D3", "#A6DBA0", "#5AAE61", "#1B7837"],
            ["#40004B", "#762A83", "#9970AB", "#C2A5CF", "#E7D4E8", "#D9F0D3", "#A6DBA0", "#5AAE61", "#1B7837", "#00441B"],
            ["#40004B", "#762A83", "#9970AB", "#C2A5CF", "#E7D4E8", "#F7F7F7", "#D9F0D3", "#A6DBA0", "#5AAE61", "#1B7837", "#00441B"]
        ]},
        PuOr: {paletteType: 1, paletteDescription: "Purple-Orange", colorBlindSafe: true, hexColors: [
            ["#F1A340"],
            ["#F1A340", "#998EC3"],
            ["#F1A340", "#F7F7F7", "#998EC3"],
            ["#E66101", "#FDB863", "#B2ABD2", "#5E3C99"],
            ["#E66101", "#FDB863", "#F7F7F7", "#B2ABD2", "#5E3C99"],
            ["#B35806", "#F1A340", "#FEE0B6", "#D8DAEB", "#998EC3", "#542788"],
            ["#B35806", "#F1A340", "#FEE0B6", "#F7F7F7", "#D8DAEB", "#998EC3", "#542788"],
            ["#B35806", "#E08214", "#FDB863", "#FEE0B6", "#D8DAEB", "#B2ABD2", "#8073AC", "#542788"],
            ["#B35806", "#E08214", "#FDB863", "#FEE0B6", "#F7F7F7", "#D8DAEB", "#B2ABD2", "#8073AC", "#542788"],
            ["#7F3B08", "#B35806", "#E08214", "#FDB863", "#FEE0B6", "#D8DAEB", "#B2ABD2", "#8073AC", "#542788", "#2D004B"],
            ["#7F3B08", "#B35806", "#E08214", "#FDB863", "#FEE0B6", "#F7F7F7", "#D8DAEB", "#B2ABD2", "#8073AC", "#542788", "#2D004B"]
        ]},
        RdBu: {paletteType: 1, paletteDescription: "Red-Blue", colorBlindSafe: true, hexColors: [
            ["#EF8A62"],
            ["#EF8A62", "#67A9CF"],
            ["#EF8A62", "#F7F7F7", "#67A9CF"],
            ["#CA0020", "#F4A582", "#92C5DE", "#0571B0"],
            ["#CA0020", "#F4A582", "#F7F7F7", "#92C5DE", "#0571B0"],
            ["#B2182B", "#EF8A62", "#FDDBC7", "#D1E5F0", "#67A9CF", "#2166AC"],
            ["#B2182B", "#EF8A62", "#FDDBC7", "#F7F7F7", "#D1E5F0", "#67A9CF", "#2166AC"],
            ["#B2182B", "#D6604D", "#F4A582", "#FDDBC7", "#D1E5F0", "#92C5DE", "#4393C3", "#2166AC"],
            ["#B2182B", "#D6604D", "#F4A582", "#FDDBC7", "#F7F7F7", "#D1E5F0", "#92C5DE", "#4393C3", "#2166AC"],
            ["#67001F", "#B2182B", "#D6604D", "#F4A582", "#FDDBC7", "#D1E5F0", "#92C5DE", "#4393C3", "#2166AC", "#053061"],
            ["#67001F", "#B2182B", "#D6604D", "#F4A582", "#FDDBC7", "#F7F7F7", "#D1E5F0", "#92C5DE", "#4393C3", "#2166AC", "#053061"]
        ]},
        RdGy: {paletteType: 1, paletteDescription: "Red-Grey", colorBlindSafe: false, hexColors: [
            ["#EF8A62"],
            ["#EF8A62", "#999999"],
            ["#EF8A62", "#FFFFFF", "#999999"],
            ["#CA0020", "#F4A582", "#BABABA", "#404040"],
            ["#CA0020", "#F4A582", "#FFFFFF", "#BABABA", "#404040"],
            ["#B2182B", "#EF8A62", "#FDDBC7", "#E0E0E0", "#999999", "#4D4D4D"],
            ["#B2182B", "#EF8A62", "#FDDBC7", "#FFFFFF", "#E0E0E0", "#999999", "#4D4D4D"],
            ["#B2182B", "#D6604D", "#F4A582", "#FDDBC7", "#E0E0E0", "#BABABA", "#878787", "#4D4D4D"],
            ["#B2182B", "#D6604D", "#F4A582", "#FDDBC7", "#FFFFFF", "#E0E0E0", "#BABABA", "#878787", "#4D4D4D"],
            ["#67001F", "#B2182B", "#D6604D", "#F4A582", "#FDDBC7", "#E0E0E0", "#BABABA", "#878787", "#4D4D4D", "#1A1A1A"],
            ["#67001F", "#B2182B", "#D6604D", "#F4A582", "#FDDBC7", "#FFFFFF", "#E0E0E0", "#BABABA", "#878787", "#4D4D4D", "#1A1A1A"]
        ]},
        RdYlBu: {paletteType: 1, paletteDescription: "Red-Yellow-Blue", colorBlindSafe: true, hexColors: [
            ["#FC8D59"],
            ["#FC8D59", "#91BFDB"],
            ["#FC8D59", "#FFFFBF", "#91BFDB"],
            ["#D7191C", "#FDAE61", "#ABD9E9", "#2C7BB6"],
            ["#D7191C", "#FDAE61", "#FFFFBF", "#ABD9E9", "#2C7BB6"],
            ["#D73027", "#FC8D59", "#FEE090", "#E0F3F8", "#91BFDB", "#4575B4"],
            ["#D73027", "#FC8D59", "#FEE090", "#FFFFBF", "#E0F3F8", "#91BFDB", "#4575B4"],
            ["#D73027", "#F46D43", "#FDAE61", "#FEE090", "#E0F3F8", "#ABD9E9", "#74ADD1", "#4575B4"],
            ["#D73027", "#F46D43", "#FDAE61", "#FEE090", "#FFFFBF", "#E0F3F8", "#ABD9E9", "#74ADD1", "#4575B4"],
            ["#A50026", "#D73027", "#F46D43", "#FDAE61", "#FEE090", "#E0F3F8", "#ABD9E9", "#74ADD1", "#4575B4", "#313695"],
            ["#A50026", "#D73027", "#F46D43", "#FDAE61", "#FEE090", "#FFFFBF", "#E0F3F8", "#ABD9E9", "#74ADD1", "#4575B4", "#313695"]
        ]},
        BuYlRd: {paletteType: 1, paletteDescription: "Blue-Yellow-Red", colorBlindSafe: true, hexColors: [
            ["#FC8D59"],
            ["#91BFDB","#FC8D59"],
            ["#91BFDB", "#FFFFBF", "#FC8D59"],
            ["#2C7BB6", "#ABD9E9", "#FDAE61","#D7191C"],
            ["#2C7BB6","#ABD9E9","#FFFFBF","#FDAE61","#D7191C"],
            ["#4575B4","#91BFDB","#E0F3F8","#FEE090","#FC8D59","#D73027"],
            ["#4575B4","#91BFDB","#E0F3F8","#FFFFBF","#FEE090","#FC8D59","#D73027"],
            ["#4575B4","#74ADD1","#ABD9E9","#E0F3F8","#FEE090","#FDAE61","#F46D43","#D73027"],
            ["#4575B4","#74ADD1","#ABD9E9","#E0F3F8","#FFFFBF","#FEE090","#FDAE61","#F46D43","#D73027"],
            ["#313695", "#4575B4", "#74ADD1", "#ABD9E9", "#E0F3F8", "#FEE090", "#FDAE61", "#F46D43", "#D73027", "#A50026"],
            ["#313695", "#4575B4", "#74ADD1", "#ABD9E9", "#E0F3F8", "#FFFFBF", "#FEE090", "#FDAE61", "#F46D43", "#D73027", "#A50026"]
        ]},
        RdYlGn: {paletteType: 1, paletteDescription: "Red-Yellow-Green", colorBlindSafe: false, hexColors: [
            ["#FC8D59"],
            ["#FC8D59", "#91CF60"],
            ["#FC8D59", "#FFFFBF", "#91CF60"],
            ["#D7191C", "#FDAE61", "#A6D96A", "#1A9641"],
            ["#D7191C", "#FDAE61", "#FFFFBF", "#A6D96A", "#1A9641"],
            ["#D73027", "#FC8D59", "#FEE08B", "#D9EF8B", "#91CF60", "#1A9850"],
            ["#D73027", "#FC8D59", "#FEE08B", "#FFFFBF", "#D9EF8B", "#91CF60", "#1A9850"],
            ["#D73027", "#F46D43", "#FDAE61", "#FEE08B", "#D9EF8B", "#A6D96A", "#66BD63", "#1A9850"],
            ["#D73027", "#F46D43", "#FDAE61", "#FEE08B", "#FFFFBF", "#D9EF8B", "#A6D96A", "#66BD63", "#1A9850"],
            ["#A50026", "#D73027", "#F46D43", "#FDAE61", "#FEE08B", "#D9EF8B", "#A6D96A", "#66BD63", "#1A9850", "#006837"],
            ["#A50026", "#D73027", "#F46D43", "#FDAE61", "#FEE08B", "#FFFFBF", "#D9EF8B", "#A6D96A", "#66BD63", "#1A9850", "#006837"]
        ]},
        Spectral: {paletteType: 1, paletteDescription: "Spectral colors", colorBlindSafe: false, hexColors: [
            ["#FC8D59"],
            ["#FC8D59", "#99D594"],
            ["#FC8D59", "#FFFFBF", "#99D594"],
            ["#D7191C", "#FDAE61", "#ABDDA4", "#2B83BA"],
            ["#D7191C", "#FDAE61", "#FFFFBF", "#ABDDA4", "#2B83BA"],
            ["#D53E4F", "#FC8D59", "#FEE08B", "#E6F598", "#99D594", "#3288BD"],
            ["#D53E4F", "#FC8D59", "#FEE08B", "#FFFFBF", "#E6F598", "#99D594", "#3288BD"],
            ["#D53E4F", "#F46D43", "#FDAE61", "#FEE08B", "#E6F598", "#ABDDA4", "#66C2A5", "#3288BD"],
            ["#D53E4F", "#F46D43", "#FDAE61", "#FEE08B", "#FFFFBF", "#E6F598", "#ABDDA4", "#66C2A5", "#3288BD"],
            ["#9E0142", "#D53E4F", "#F46D43", "#FDAE61", "#FEE08B", "#E6F598", "#ABDDA4", "#66C2A5", "#3288BD", "#5E4FA2"],
            ["#9E0142", "#D53E4F", "#F46D43", "#FDAE61", "#FEE08B", "#FFFFBF", "#E6F598", "#ABDDA4", "#66C2A5", "#3288BD", "#5E4FA2"]
        ]},
        /* qualitative colors */
        Accent: {paletteType: 2, paletteDescription: "Accents", colorBlindSafe: false, hexColors: [
            ["#7FC97F"],
            ["#7FC97F", "#FDC086"],
            ["#7FC97F", "#BEAED4", "#FDC086"],
            ["#7FC97F", "#BEAED4", "#FDC086", "#FFFF99"],
            ["#7FC97F", "#BEAED4", "#FDC086", "#FFFF99", "#386CB0"],
            ["#7FC97F", "#BEAED4", "#FDC086", "#FFFF99", "#386CB0", "#F0027F"],
            ["#7FC97F", "#BEAED4", "#FDC086", "#FFFF99", "#386CB0", "#F0027F", "#BF5B17"],
            ["#7FC97F", "#BEAED4", "#FDC086", "#FFFF99", "#386CB0", "#F0027F", "#BF5B17", "#666666"]
        ]},
        Dark2: {paletteType: 2, paletteDescription: "Dark colors", colorBlindSafe: false, hexColors: [
            ["#1B9E77"],
            ["#1B9E77", "#7570B3"],
            ["#1B9E77", "#D95F02", "#7570B3"],
            ["#1B9E77", "#D95F02", "#7570B3", "#E7298A"],
            ["#1B9E77", "#D95F02", "#7570B3", "#E7298A", "#66A61E"],
            ["#1B9E77", "#D95F02", "#7570B3", "#E7298A", "#66A61E", "#E6AB02"],
            ["#1B9E77", "#D95F02", "#7570B3", "#E7298A", "#66A61E", "#E6AB02", "#A6761D"],
            ["#1B9E77", "#D95F02", "#7570B3", "#E7298A", "#66A61E", "#E6AB02", "#A6761D", "#666666"]
        ]},
        Paired: {paletteType: 2, paletteDescription: "Paired colors", colorBlindSafe: true, hexColors: [
            ["#A6CEE3"],
            ["#A6CEE3", "#B2DF8A"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00", "#CAB2D6"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00", "#CAB2D6", "#6A3D9A"],
            ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00", "#CAB2D6", "#6A3D9A", "#FFFF99"]
        ]},
        Pastel1: {paletteType: 2, paletteDescription: "Pastel1 colors", colorBlindSafe: false, hexColors: [
            ["#FBB4AE"],
            ["#FBB4AE", "#CCEBC5"],
            ["#FBB4AE", "#B3CDE3", "#CCEBC5"],
            ["#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4"],
            ["#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6"],
            ["#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC"],
            ["#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC", "#E5D8BD"],
            ["#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC", "#E5D8BD", "#FDDAEC"],
            ["#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC", "#E5D8BD", "#FDDAEC", "#F2F2F2"]
        ]},
        Pastel2: {paletteType: 2, paletteDescription: "Pastel2 colors", colorBlindSafe: false, hexColors: [
            ["#B3E2CD"],
            ["#B3E2CD", "#CBD5E8"],
            ["#B3E2CD", "#FDCDAC", "#CBD5E8"],
            ["#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4"],
            ["#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9"],
            ["#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9", "#FFF2AE"],
            ["#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9", "#FFF2AE", "#F1E2CC"],
            ["#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9", "#FFF2AE", "#F1E2CC", "#CCCCCC"]
        ]},
        Set1: {paletteType: 2, paletteDescription: "Set1 colors", colorBlindSafe: false, hexColors: [
            ["#E41A1C"],
            ["#E41A1C", "#4DAF4A"],
            ["#E41A1C", "#377EB8", "#4DAF4A"],
            ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3"],
            ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00"],
            ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#FFFF33"],
            ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#FFFF33", "#A65628"],
            ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#FFFF33", "#A65628", "#F781BF"],
            ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#FFFF33", "#A65628", "#F781BF", "#999999"]
        ]},
        Set2: {paletteType: 2, paletteDescription: "Set2 colors", colorBlindSafe: false, hexColors: [
            ["#66C2A5"],
            ["#66C2A5", "#8DA0CB"],
            ["#66C2A5", "#FC8D62", "#8DA0CB"],
            ["#66C2A5", "#FC8D62", "#8DA0CB", "#E78AC3"],
            ["#66C2A5", "#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854"],
            ["#66C2A5", "#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854", "#FFD92F"],
            ["#66C2A5", "#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854", "#FFD92F", "#E5C494"],
            ["#66C2A5", "#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854", "#FFD92F", "#E5C494", "#B3B3B"]
        ]},
        Set3: {paletteType: 2, paletteDescription: "Set3 colors", colorBlindSafe: false, hexColors: [
            ["#8DD3C7"],
            ["#8DD3C7", "#BEBADA"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#D9D9D9"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#D9D9D9", "#BC80BD"],
            ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#D9D9D9", "#BC80BD", "#CCEBC5"]
        ]},
        /* sequential colors */
        Blues: {paletteType: 3, paletteDescription: "Blue shades", colorBlindSafe: true, hexColors: [
            ["#DEEBF7"],
            ["#DEEBF7", "#3182BD"],
            ["#DEEBF7", "#9ECAE1", "#3182BD"],
            ["#EFF3FF", "#BDD7E7", "#6BAED6", "#2171B5"],
            ["#EFF3FF", "#BDD7E7", "#6BAED6", "#3182BD", "#08519C"],
            ["#EFF3FF", "#C6DBEF", "#9ECAE1", "#6BAED6", "#3182BD", "#08519C"],
            ["#EFF3FF", "#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#084594"],
            ["#F7FBFF", "#DEEBF7", "#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#084594"],
            ["#F7FBFF", "#DEEBF7", "#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]
        ]},
        BuGn: {paletteType: 3, paletteDescription: "Blue-Green shades", colorBlindSafe: true, hexColors: [
            ["#E5F5F9"],
            ["#E5F5F9", "#2CA25F"],
            ["#E5F5F9", "#99D8C9", "#2CA25F"],
            ["#EDF8FB", "#B2E2E2", "#66C2A4", "#238B45"],
            ["#EDF8FB", "#B2E2E2", "#66C2A4", "#2CA25F", "#006D2C"],
            ["#EDF8FB", "#CCECE6", "#99D8C9", "#66C2A4", "#2CA25F", "#006D2C"],
            ["#EDF8FB", "#CCECE6", "#99D8C9", "#66C2A4", "#41AE76", "#238B45", "#005824"],
            ["#F7FCFD", "#E5F5F9", "#CCECE6", "#99D8C9", "#66C2A4", "#41AE76", "#238B45", "#005824"],
            ["#F7FCFD", "#E5F5F9", "#CCECE6", "#99D8C9", "#66C2A4", "#41AE76", "#238B45", "#006D2C", "#00441B"]
        ]},
        BuPu: {paletteType: 3, paletteDescription: "Blue-Purple shades", colorBlindSafe: true, hexColors: [
            ["#E0ECF4"],
            ["#E0ECF4", "#8856A7"],
            ["#E0ECF4", "#9EBCDA", "#8856A7"],
            ["#EDF8FB", "#B3CDE3", "#8C96C6", "#88419D"],
            ["#EDF8FB", "#B3CDE3", "#8C96C6", "#8856A7", "#810F7C"],
            ["#EDF8FB", "#BFD3E6", "#9EBCDA", "#8C96C6", "#8856A7", "#810F7C"],
            ["#EDF8FB", "#BFD3E6", "#9EBCDA", "#8C96C6", "#8C6BB1", "#88419D", "#6E016B"],
            ["#F7FCFD", "#E0ECF4", "#BFD3E6", "#9EBCDA", "#8C96C6", "#8C6BB1", "#88419D", "#6E016B"],
            ["#F7FCFD", "#E0ECF4", "#BFD3E6", "#9EBCDA", "#8C96C6", "#8C6BB1", "#88419D", "#810F7C", "#4D004B"]
        ]},
        GnBu: {paletteType: 3, paletteDescription: "Green-Blue shades", colorBlindSafe: true, hexColors: [
            ["#E0F3DB"],
            ["#E0F3DB", "#43A2CA"],
            ["#E0F3DB", "#A8DDB5", "#43A2CA"],
            ["#F0F9E8", "#BAE4BC", "#7BCCC4", "#2B8CBE"],
            ["#F0F9E8", "#BAE4BC", "#7BCCC4", "#43A2CA", "#0868AC"],
            ["#F0F9E8", "#CCEBC5", "#A8DDB5", "#7BCCC4", "#43A2CA", "#0868AC"],
            ["#F0F9E8", "#CCEBC5", "#A8DDB5", "#7BCCC4", "#4EB3D3", "#2B8CBE", "#08589E"],
            ["#F7FCF0", "#E0F3DB", "#CCEBC5", "#A8DDB5", "#7BCCC4", "#4EB3D3", "#2B8CBE", "#08589E"],
            ["#F7FCF0", "#E0F3DB", "#CCEBC5", "#A8DDB5", "#7BCCC4", "#4EB3D3", "#2B8CBE", "#0868AC", "#084081"]
        ]},
        Greens: {paletteType: 3, paletteDescription: "Green shades", colorBlindSafe: true, hexColors: [
            ["#E5F5E0"],
            ["#E5F5E0", "#31A354"],
            ["#E5F5E0", "#A1D99B", "#31A354"],
            ["#EDF8E9", "#BAE4B3", "#74C476", "#238B45"],
            ["#EDF8E9", "#BAE4B3", "#74C476", "#31A354", "#006D2C"],
            ["#EDF8E9", "#C7E9C0", "#A1D99B", "#74C476", "#31A354", "#006D2C"],
            ["#EDF8E9", "#C7E9C0", "#A1D99B", "#74C476", "#41AB5D", "#238B45", "#005A32"],
            ["#F7FCF5", "#E5F5E0", "#C7E9C0", "#A1D99B", "#74C476", "#41AB5D", "#238B45", "#005A32"],
            ["#F7FCF5", "#E5F5E0", "#C7E9C0", "#A1D99B", "#74C476", "#41AB5D", "#238B45", "#006D2C", "#00441B"]
        ]},
        Greys: {paletteType: 3, paletteDescription: "Grey shades", colorBlindSafe: true, hexColors: [
            ["#F0F0F0"],
            ["#F0F0F0", "#636363"],
            ["#F0F0F0", "#BDBDBD", "#636363"],
            ["#F7F7F7", "#CCCCCC", "#969696", "#525252"],
            ["#F7F7F7", "#CCCCCC", "#969696", "#636363", "#252525"],
            ["#F7F7F7", "#D9D9D9", "#BDBDBD", "#969696", "#636363", "#252525"],
            ["#F7F7F7", "#D9D9D9", "#BDBDBD", "#969696", "#737373", "#525252", "#252525"],
            ["#FFFFFF", "#F0F0F0", "#D9D9D9", "#BDBDBD", "#969696", "#737373", "#525252", "#252525"],
            ["#FFFFFF", "#F0F0F0", "#D9D9D9", "#BDBDBD", "#969696", "#737373", "#525252", "#252525", "#000000"]
        ]},
        Oranges: {paletteType: 3, paletteDescription: "Orange shades", colorBlindSafe: true, hexColors: [
            ["#FEE6CE"],
            ["#FEE6CE", "#E6550D"],
            ["#FEE6CE", "#FDAE6B", "#E6550D"],
            ["#FEEDDE", "#FDBE85", "#FD8D3C", "#D94701"],
            ["#FEEDDE", "#FDBE85", "#FD8D3C", "#E6550D", "#A63603"],
            ["#FEEDDE", "#FDD0A2", "#FDAE6B", "#FD8D3C", "#E6550D", "#A63603"],
            ["#FEEDDE", "#FDD0A2", "#FDAE6B", "#FD8D3C", "#F16913", "#D94801", "#8C2D04"],
            ["#FFF5EB", "#FEE6CE", "#FDD0A2", "#FDAE6B", "#FD8D3C", "#F16913", "#D94801", "#8C2D04"],
            ["#FFF5EB", "#FEE6CE", "#FDD0A2", "#FDAE6B", "#FD8D3C", "#F16913", "#D94801", "#A63603", "#7F2704"]
        ]},
        OrRd: {paletteType: 3, paletteDescription: "Orange-Red shades", colorBlindSafe: true, hexColors: [
            ["#FEE8C8"],
            ["#FEE8C8", "#E34A33"],
            ["#FEE8C8", "#FDBB84", "#E34A33"],
            ["#FEF0D9", "#FDCC8A", "#FC8D59", "#D7301F"],
            ["#FEF0D9", "#FDCC8A", "#FC8D59", "#E34A33", "#B30000"],
            ["#FEF0D9", "#FDD49E", "#FDBB84", "#FC8D59", "#E34A33", "#B30000"],
            ["#FEF0D9", "#FDD49E", "#FDBB84", "#FC8D59", "#EF6548", "#D7301F", "#990000"],
            ["#FFF7EC", "#FEE8C8", "#FDD49E", "#FDBB84", "#FC8D59", "#EF6548", "#D7301F", "#990000"],
            ["#FFF7EC", "#FEE8C8", "#FDD49E", "#FDBB84", "#FC8D59", "#EF6548", "#D7301F", "#B30000", "#7F0000"]
        ]},
        PuBu: {paletteType: 3, paletteDescription: "Purple-Blue shades", colorBlindSafe: true, hexColors: [
            ["#ECE7F2"],
            ["#ECE7F2", "#2B8CBE"],
            ["#ECE7F2", "#A6BDDB", "#2B8CBE"],
            ["#F1EEF6", "#BDC9E1", "#74A9CF", "#0570B0"],
            ["#F1EEF6", "#BDC9E1", "#74A9CF", "#2B8CBE", "#045A8D"],
            ["#F1EEF6", "#D0D1E6", "#A6BDDB", "#74A9CF", "#2B8CBE", "#045A8D"],
            ["#F1EEF6", "#D0D1E6", "#A6BDDB", "#74A9CF", "#3690C0", "#0570B0", "#034E7B"],
            ["#FFF7FB", "#ECE7F2", "#D0D1E6", "#A6BDDB", "#74A9CF", "#3690C0", "#0570B0", "#034E7B"],
            ["#FFF7FB", "#ECE7F2", "#D0D1E6", "#A6BDDB", "#74A9CF", "#3690C0", "#0570B0", "#045A8D", "#023858"]
        ]},
        PuBuGn: {paletteType: 3, paletteDescription: "Purple-Blue-Green shades", colorBlindSafe: true, hexColors: [
            ["#ECE2F0"],
            ["#ECE2F0", "#1C9099"],
            ["#ECE2F0", "#A6BDDB", "#1C9099"],
            ["#F6EFF7", "#BDC9E1", "#67A9CF", "#02818A"],
            ["#F6EFF7", "#BDC9E1", "#67A9CF", "#1C9099", "#016C59"],
            ["#F6EFF7", "#D0D1E6", "#A6BDDB", "#67A9CF", "#1C9099", "#016C59"],
            ["#F6EFF7", "#D0D1E6", "#A6BDDB", "#67A9CF", "#3690C0", "#02818A", "#016450"],
            ["#FFF7FB", "#ECE2F0", "#D0D1E6", "#A6BDDB", "#67A9CF", "#3690C0", "#02818A", "#016450"],
            ["#FFF7FB", "#ECE2F0", "#D0D1E6", "#A6BDDB", "#67A9CF", "#3690C0", "#02818A", "#016C59", "#014636"]
        ]},
        PuRd: {paletteType: 3, paletteDescription: "Purple-Red shades", colorBlindSafe: true, hexColors: [
            ["#E7E1EF"],
            ["#E7E1EF", "#DD1C77"],
            ["#E7E1EF", "#C994C7", "#DD1C77"],
            ["#F1EEF6", "#D7B5D8", "#DF65B0", "#CE1256"],
            ["#F1EEF6", "#D7B5D8", "#DF65B0", "#DD1C77", "#980043"],
            ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"],
            ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#E7298A", "#CE1256", "#91003F"],
            ["#F7F4F9", "#E7E1EF", "#D4B9DA", "#C994C7", "#DF65B0", "#E7298A", "#CE1256", "#91003F"],
            ["#F7F4F9", "#E7E1EF", "#D4B9DA", "#C994C7", "#DF65B0", "#E7298A", "#CE1256", "#980043", "#67001F"]
        ]},
        Purples: {paletteType: 3, paletteDescription: "Purple shades", colorBlindSafe: true, hexColors: [
            ["#EFEDF5"],
            ["#EFEDF5", "#756BB1"],
            ["#EFEDF5", "#BCBDDC", "#756BB1"],
            ["#F2F0F7", "#CBC9E2", "#9E9AC8", "#6A51A3"],
            ["#F2F0F7", "#CBC9E2", "#9E9AC8", "#756BB1", "#54278F"],
            ["#F2F0F7", "#DADAEB", "#BCBDDC", "#9E9AC8", "#756BB1", "#54278F"],
            ["#F2F0F7", "#DADAEB", "#BCBDDC", "#9E9AC8", "#807DBA", "#6A51A3", "#4A1486"],
            ["#FCFBFD", "#EFEDF5", "#DADAEB", "#BCBDDC", "#9E9AC8", "#807DBA", "#6A51A3", "#4A1486"],
            ["#FCFBFD", "#EFEDF5", "#DADAEB", "#BCBDDC", "#9E9AC8", "#807DBA", "#6A51A3", "#54278F", "#3F007D"]
        ]},
        RdPu: {paletteType: 3, paletteDescription: "Red-Purple shades", colorBlindSafe: true, hexColors: [
            ["#FDE0DD"],
            ["#FDE0DD", "#C51B8A"],
            ["#FDE0DD", "#FA9FB5", "#C51B8A"],
            ["#FEEBE2", "#FBB4B9", "#F768A1", "#AE017E"],
            ["#FEEBE2", "#FBB4B9", "#F768A1", "#C51B8A", "#7A0177"],
            ["#FEEBE2", "#FCC5C0", "#FA9FB5", "#F768A1", "#C51B8A", "#7A0177"],
            ["#FEEBE2", "#FCC5C0", "#FA9FB5", "#F768A1", "#DD3497", "#AE017E", "#7A0177"],
            ["#FFF7F3", "#FDE0DD", "#FCC5C0", "#FA9FB5", "#F768A1", "#DD3497", "#AE017E", "#7A0177"],
            ["#FFF7F3", "#FDE0DD", "#FCC5C0", "#FA9FB5", "#F768A1", "#DD3497", "#AE017E", "#7A0177", "#49006A"]
        ]},
        Reds: {paletteType: 3, paletteDescription: "Red shades", colorBlindSafe: true, hexColors: [
            ["#FEE0D2"],
            ["#FEE0D2", "#DE2D26"],
            ["#FEE0D2", "#FC9272", "#DE2D26"],
            ["#FEE5D9", "#FCAE91", "#FB6A4A", "#CB181D"],
            ["#FEE5D9", "#FCAE91", "#FB6A4A", "#DE2D26", "#A50F15"],
            ["#FEE5D9", "#FCBBA1", "#FC9272", "#FB6A4A", "#DE2D26", "#A50F15"],
            ["#FEE5D9", "#FCBBA1", "#FC9272", "#FB6A4A", "#EF3B2C", "#CB181D", "#99000D"],
            ["#FFF5F0", "#FEE0D2", "#FCBBA1", "#FC9272", "#FB6A4A", "#EF3B2C", "#CB181D", "#99000D"],
            ["#FFF5F0", "#FEE0D2", "#FCBBA1", "#FC9272", "#FB6A4A", "#EF3B2C", "#CB181D", "#A50F15", "#67000D"]
        ]},
        YlGn: {paletteType: 3, paletteDescription: "Yellow-Green shades", colorBlindSafe: true, hexColors: [
            ["#F7FCB9"],
            ["#F7FCB9", "#31A354"],
            ["#F7FCB9", "#ADDD8E", "#31A354"],
            ["#FFFFCC", "#C2E699", "#78C679", "#238443"],
            ["#FFFFCC", "#C2E699", "#78C679", "#31A354", "#006837"],
            ["#FFFFCC", "#D9F0A3", "#ADDD8E", "#78C679", "#31A354", "#006837"],
            ["#FFFFCC", "#D9F0A3", "#ADDD8E", "#78C679", "#41AB5D", "#238443", "#005A32"],
            ["#FFFFE5", "#F7FCB9", "#D9F0A3", "#ADDD8E", "#78C679", "#41AB5D", "#238443", "#005A32"],
            ["#FFFFE5", "#F7FCB9", "#D9F0A3", "#ADDD8E", "#78C679", "#41AB5D", "#238443", "#006837", "#004529"]
        ]},
        YlGnBu: {paletteType: 3, paletteDescription: "Yellow-Green-Blue shades", colorBlindSafe: true, hexColors: [
            ["#EDF8B1"],
            ["#EDF8B1", "#2C7FB8"],
            ["#EDF8B1", "#7FCDBB", "#2C7FB8"],
            ["#FFFFCC", "#A1DAB4", "#41B6C4", "#225EA8"],
            ["#FFFFCC", "#A1DAB4", "#41B6C4", "#2C7FB8", "#253494"],
            ["#FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8", "#253494"],
            ["#FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8", "#0C2C84"],
            ["#FFFFD9", "#EDF8B1", "#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8", "#0C2C84"],
            ["#FFFFD9", "#EDF8B1", "#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8", "#253494", "#081D58"]
        ]},
        YlOrBr: {paletteType: 3, paletteDescription: "Yellow-Orange-Brown shades", colorBlindSafe: true, hexColors: [
            ["#FFF7BC"],
            ["#FFF7BC", "#D95F0E"],
            ["#FFF7BC", "#FEC44F", "#D95F0E"],
            ["#FFFFD4", "#FED98E", "#FE9929", "#CC4C02"],
            ["#FFFFD4", "#FED98E", "#FE9929", "#D95F0E", "#993404"],
            ["#FFFFD4", "#FEE391", "#FEC44F", "#FE9929", "#D95F0E", "#993404"],
            ["#FFFFD4", "#FEE391", "#FEC44F", "#FE9929", "#EC7014", "#CC4C02", "#8C2D04"],
            ["#FFFFE5", "#FFF7BC", "#FEE391", "#FEC44F", "#FE9929", "#EC7014", "#CC4C02", "#8C2D04"],
            ["#FFFFE5", "#FFF7BC", "#FEE391", "#FEC44F", "#FE9929", "#EC7014", "#CC4C02", "#993404", "#662506"]
        ]},
        YlOrRd: {paletteType: 3, paletteDescription: "Yellow-Orange-Red shades", colorBlindSafe: true, hexColors: [
            ["#FFEDA0"],
            ["#FFEDA0", "#F03B20"],
            ["#FFEDA0", "#FEB24C", "#F03B20"],
            ["#FFFFB2", "#FECC5C", "#FD8D3C", "#E31A1C"],
            ["#FFFFB2", "#FECC5C", "#FD8D3C", "#F03B20", "#BD0026"],
            ["#FFFFB2", "#FED976", "#FEB24C", "#FD8D3C", "#F03B20", "#BD0026"],
            ["#FFFFB2", "#FED976", "#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C", "#B10026"],
            ["#FFFFCC", "#FFEDA0", "#FED976", "#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C", "#B10026"],
            ["#FFFFCC", "#FFEDA0", "#FED976", "#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C", "#BD0026", "#800026"]
        ]},
        hsvRdBl: {paletteType: 1, paletteDescription: "HSV Red-Blue", colorBlindSafe: true, hexColors: [
            ["#FF0000"],
            ["#FF0000", "#0000FF"],
            ["#FF0000", "#FFFFFF", "#0000FF"],
            ["#FF0000", "#FFAAAA", "#AAAAFF", "#0000FF"],
            ["#FF0000", "#FF8080", "#FFFFFF", "#8080FF", "#0000FF"],
            ["#FF0000", "#FF6666", "#FFCCCC", "#CCCCFF", "#6666FF", "#0000FF"],
            ["#FF0000", "#FF5555", "#FFAAAA", "#FFFFFF", "#AAAAFF", "#5555FF", "#0000FF"],
            ["#FF0000", "#FF4949", "#FF9292", "#FFDBDB", "#DBDBFF", "#9292FF", "#4949FF", "#0000FF"],
            ["#FF0000", "#FF4040", "#FF8080", "#FFBFBF", "#FFFFFF", "#BFBFFF", "#8080FF", "#4040FF", "#0000FF"],
            ["#FF0000", "#FF3939", "#FF7171", "#FFAAAA", "#FFE3E3", "#E3E3FF", "#AAAAFF", "#7171FF", "#3939FF", "#0000FF"],
            ["#FF0000", "#FF3333", "#FF6666", "#FF9999", "#FFCCCC", "#FFFFFF", "#CCCCFF", "#9999FF", "#6666FF", "#3333FF", "#0000FF"]
        ]},
        hsvCyMg: {paletteType: 1, paletteDescription: "HSV Red-Blue", colorBlindSafe: true, hexColors: [
            ["#00FFFF"],
            ["#00FFFF", "#FF00FF"],
            ["#00FFFF", "#FFFFFF", "#FF00FF"],
            ["#00FFFF", "#AAFFFF", "#FFAAFF", "#FF00FF"],
            ["#00FFFF", "#80FFFF", "#FFFFFF", "#FF80FF", "#FF00FF"],
            ["#00FFFF", "#66FFFF", "#CCFFFF", "#FFCCFF", "#FF66FF", "#FF00FF"],
            ["#00FFFF", "#55FFFF", "#AAFFFF", "#FFFFFF", "#FFAAFF", "#FF55FF", "#FF00FF"],
            ["#00FFFF", "#49FFFF", "#92FFFF", "#DBFFFF", "#FFDBFF", "#FF92FF", "#FF49FF", "#FF00FF"],
            ["#00FFFF", "#40FFFF", "#80FFFF", "#BFFFFF", "#FFFFFF", "#FFBFFF", "#FF80FF", "#FF40FF", "#FF00FF"],
            ["#00FFFF", "#39FFFF", "#71FFFF", "#AAFFFF", "#E3FFFF", "#FFE3FF", "#FFAAFF", "#FF71FF", "#FF39FF", "#FF00FF"],
            ["#00FFFF", "#33FFFF", "#66FFFF", "#99FFFF", "#CCFFFF", "#FFFFFF", "#FFCCFF", "#FF99FF", "#FF66FF", "#FF33FF", "#FF00FF"]
        ]},

        bgyor: {paletteType: 4, paletteDescription: "Blue Green Yellow Orange Red", colorBlindSafe: true, hexColors: [
            ["#0000FF"],
            ["#0000FF", "#FF0000"],
            ["#0000FF", "#00FF00", "#FF0000"],
            ["#0000FF", "#00FFFF", "#FFFF00", "#FF0000"],
            ["#0000FF", "#00FFFF", "#00FF00", "#FFFF00", "#FF0000"],
            ["#0000FF", "#00FFFF", "00FF80", "80FF00", "#FFFF00", "#FF0000"],
            ["#0000FF", "#00FFFF", "00FF80", "#00FF00", "80FF00", "#FFFF00", "#FF0000"],
            ["#0000FF", "#0080FF", "#00FFFF", "00FF80", "80FF00", "#FFFF00", "#FF8000", "#FF0000"],
            ["#0000FF", "#0080FF", "#00FFFF", "00FF80","#00FF00", "80FF00", "#FFFF00", "#FF8000", "#FF0000"]
        ]},
        PairedPunch: {paletteType: 4, paletteDescription: "Paired colors with more punch", colorBlindSafe: true, hexColors: [
            ["#FFFFFF"],
            ["#FFFFFF", "#4673FF"],
            ["#FFFFFF", "#4673FF", "#FF3197"],
            ["#FFFFFF", "#4673FF", "#FF3197", "#00CB55"],
            ["#FFFFFF", "#4673FF", "#FF3197", "#00CB55", "#FB443B"],
            ["#FFFFFF", "#4673FF", "#FF3197", "#00CB55", "#FB443B", "#8C44DC"],
            ["#FFFFFF", "#4673FF", "#FF3197", "#00CB55", "#FB443B", "#8C44DC", "#354B8E"],
            ["#FFFFFF", "#4673FF", "#FF3197", "#00CB55", "#FB443B", "#8C44DC", "#354B8E", "#383838"],
            ["#FFFFFF", "#4673FF", "#FF3197", "#00CB55", "#FB443B", "#8C44DC", "#354B8E", "#383838", "#009054"],
            ["#FFFFFF", "#4673FF", "#FF3197", "#00CB55", "#FB443B", "#8C44DC", "#354B8E", "#383838", "#009054", "#B2B2B2"],
            ["#FFFFFF", "#4673FF", "#FF3197", "#00CB55", "#FB443B", "#8C44DC", "#354B8E", "#383838", "#009054", "#B2B2B2", "#A7366E"]
        ]}

    };
}; // end constructor

ColorBrewer.prototype = Object.create(ColorBrewer);

/**
 *  Get the description string from the palette object
 *  @param {object} palette - the palette object to query
 *  @returns {string} description - description of the palette object.
 */
ColorBrewer.prototype.getPaletteDescription = function getPaletteDescription(palette) {
    return palette.paletteDescription;
};

/**
 *  Get the number of colors in the largest (last) palette.
 *  Note that this assumes that the number of color arrays is equal
 *  to the length of the largest color array.
 *  @param {object} palette - the palette object to query
 *  @returns {number} description - description of the palette object.
 */
ColorBrewer.prototype.getMaximumColorCount = function getMaximumColorCount(palette) {
    return palette.hexColors.length;
};

/**
 *  Return whether or not the palette is color-blind safe
 *  @param {object} palette - the palette object to query
 *  @returns {boolean} palette.colorBlindSafe - boolean property for color-blind safety
 */
ColorBrewer.prototype.isColorBlindSafe = function isColorBlindSafe(palette) {
    return palette.colorBlindSafe;
};

/**
 *  Return an array of Sequential color palette objects
 *  @param {boolean} colorBlindSafe - true for color-blind safe, false for not
 *  @returns {object} array of palette objects.
 */
ColorBrewer.prototype.getSequentialColorPalettes = function getSequentialColorPalettes(colorBlindSafe) {
    return this.getPalettes(3, colorBlindSafe);
};

/**
 *  Return an array of Diverging color palette objects
 *  @param {boolean} colorBlindSafe - true for color-blind safe, false for not
 *  @returns {object} array of palette objects.
 */
ColorBrewer.prototype.getDivergingColorPalettes = function getDivergingColorPalettes(colorBlindSafe) {
    return this.getPalettes(1, colorBlindSafe);
};

/**
 *  Return an array of Qualitative color palette objects
 *  @param {boolean} colorBlindSafe - true for color-blind safe, false for not
 *  @returns {object} array of palette objects.
 */
ColorBrewer.prototype.getQualitativeColorPalettes = function getQualitativeColorPalettes(colorBlindSafe) {
    return this.getPalettes(2, colorBlindSafe);
};

/**
 *  Return an array of palette objects
 *  @param {number} paletteType - type of palette
 *  @param {boolean} colorBlindSafe - true for color-blind safe, false for not
 *  @returns {object} array of palette objects.
 */
ColorBrewer.prototype.getPalettes = function getPalettes(paletteType, colorBlindSafe) {
    var palette,
        palettes = [];
    var i;
    if(colorBlindSafe) {
        for (palette in this.palettes) {
            if(this.palettes.hasOwnProperty(palette)) {
                if(this.palettes[palette].paletteType === paletteType && this.palettes[palette].colorBlindSafe) {
                    palettes.push(this.palettes[palette]);
                }
            }
        }
    } else {
        for (palette in this.palettes) {
            if(this.palettes.hasOwnProperty(palette)) {
                if(this.palettes[palette].paletteType === paletteType) {
                    palettes.push(this.palettes[palette]);
                }
            }
        }
    }

    return palettes;
};

/**
 *  Return an array of color values from the selected palette
 *  @param {object} palette - the selected palette object
 *  @param {number} colorCount - the number of colors to return
 *  @returns {object} array of css-ready color value strings.
 */
ColorBrewer.prototype.getColorPalette = function getColorPalette(palette, colorCount) {
    if (colorCount < this.getMaximumColorCount(palette)) {
        return palette.hexColors[colorCount-1];
    } else {
        // if the color count exceeds the number of a
        // available in a palette, interpolate between
        // colors to create an extended color palette
        return this.interpolatedColors(palette,colorCount);
    }
};

/**
 *  Return an interpolated array of color values based on the selected palette
 *  @param {object} palette - the selected palette object
 *  @param {number} colorCount - the number of colors to return
 *  @returns {object} array colors interpolated from the largest color set.
 */
ColorBrewer.prototype.interpolatedColors = function interpolatedColors(palette, colorCount) {
    var colors = [];
    var maxIndex = this.getMaximumColorCount(palette) - 1;
    var scale = maxIndex/(colorCount - 1);
    var i,
        value,
        index,
        c1,
        c2,
        remainder,
        red,
        green,
        blue,
        color,
        pad = '0';
    for (i = 0; i < colorCount; i++) {
        value = scale * i;
        index = parseInt(Math.floor(value));
        c1 = new this.Color(palette.hexColors[maxIndex][index]);
        remainder = 0;
        c2 = null;
        if (index + 1 < palette.hexColors.length) {
            c2 = new this.Color(palette.hexColors[maxIndex][index + 1]);
            remainder = value - index;
        } else {
            c2 = new this.Color(palette.hexColors[maxIndex][index]);
        }

        red   = Math.round((1 - remainder) * c1.getRed()+ (remainder) * c2.getRed()).toString(16);
        green = Math.round((1 - remainder) * c1.getGreen() + (remainder) * c2.getGreen()).toString(16);
        blue  = Math.round((1 - remainder) * c1.getBlue() + (remainder) * c2.getBlue()).toString(16);

        color = '#' + this.padHex(red) + this.padHex(green) + this.padHex(blue);
        colors.push(color);
    }
    return colors;
};

/**
 *  Returns a hex string left-padded with zeroes to length 2
 *  Used to properly format css hexadecimal color strings
 *  e.g. turns F into 0F, 9 into 09, etc.
 *  @param {string} hexString - hexadecimal string to be padded
 *  @returns {string} hexadecimal string left padded to 2 characters long
 */
ColorBrewer.prototype.padHex = function padHex(hexString) {
    var pad = '0';
    return pad.substring(0,2 - hexString.length) + hexString;
};

/**
 *  Color object used for hex-decimal transformations
 *  @param {string} hexColor - hex formatted color string, starting with '#'
 *  @returns {object} Color
 */
ColorBrewer.prototype.Color = function Color(hexColor) {
    this.hexColor = hexColor;
    var self = this;

    this.getRed = function getRed() {
        return parseInt('0x' + hexColor.substr(1,2));
    };

    this.getGreen = function getGreen() {
        return parseInt('0x' + hexColor.substr(3,2));
    };

    this.getBlue = function getBlue() {
        return parseInt('0x' + hexColor.substr(5,2));
    };
};


;// Original version here:
// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Colors/Color_picker_tool

//Licensing information is here:
//https://developer.mozilla.org/en-US/docs/MDN/About#Copyrights_and_licenses
// Here is the relevant licensing information as per the page above:
//Code samples added on or after August 20, 2010 are in the public domain.
//No licensing notice is necessary, but if you need one, you can use:
// "Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/".

'use strict';
var Autodesk = Autodesk || {};
Autodesk.Nano = Autodesk.Nano || {};
Autodesk.Nano.UIColorPicker = function UIColorPicker(parentView) {

    function getElemById(id) {
        return document.getElementById(id);
    }

    var subscribers = [];
    var pickers = [];
    var that = this;

    /**
     * RGBA Color class
     *
     * HSV/HSB and HSL (hue, saturation, value / brightness, lightness)
     * @param hue            0-360
     * @param saturation    0-100
     * @param value        0-100
     * @param lightness        0-100
     * @param color  color object
     * @param that ref to ui object
     */

    function Color(color, that) {

        if (color instanceof Color === true) {
            this.copy(color);
            return;
        }

        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 1;
        this.hue = 0;
        this.saturation = 0;
        this.value = 0;
        this.lightness = 0;
        this.format = 'HSV';
        this.ui = that;
    }

    function RGBColor(r, g, b) {
        var color = new Color(null, that);
        color.setRGBA(r, g, b, 1);
        return color;
    }

    function RGBAColor(r, g, b, a) {
        var color = new Color(null, that);
        color.setRGBA(r, g, b, a);
        return color;
    }

    function HSVColor(h, s, v) {
        var color = new Color(null, that);
        color.setHSV(h, s, v);
        return color;
    }

    function HSVAColor(h, s, v, a) {
        var color = new Color(null, that);
        color.setHSV(h, s, v);
        color.a = a;
        return color;
    }

    function HSLColor(h, s, l) {
        var color = new Color(null, that);
        color.setHSL(h, s, l);
        return color;
    }

    function HSLAColor(h, s, l, a) {
        var color = new Color(null, that);
        color.setHSL(h, s, l);
        color.a = a;
        return color;
    }

    Color.prototype.copy = function copy(obj) {
        if (obj instanceof Color !== true) {
            console.log('Typeof parameter not Color');
            return;
        }

        this.r = obj.r;
        this.g = obj.g;
        this.b = obj.b;
        this.a = obj.a;
        this.hue = obj.hue;
        this.saturation = obj.saturation;
        this.value = obj.value;
        this.format = '' + obj.format;
        this.lightness = obj.lightness;
    };

    Color.prototype.setFormat = function setFormat(format) {
        if (format === 'HSV')
            this.format = 'HSV';
        if (format === 'HSL')
            this.format = 'HSL';
    };

    /*========== Methods to set Color Properties ==========*/

    Color.prototype.isValidRGBValue = function isValidRGBValue(value) {
        return (typeof(value) === 'number' && isNaN(value) === false &&
        value >= 0 && value <= 255);
    };

    Color.prototype.setRGBA = function setRGBA(red, green, blue, alpha) {
        if (this.isValidRGBValue(red) === false ||
            this.isValidRGBValue(green) === false ||
            this.isValidRGBValue(blue) === false)
            return;

        this.r = red | 0;
        this.g = green | 0;
        this.b = blue | 0;

        if (this.isValidRGBValue(alpha) === true)
            this.a = alpha | 0;
    };

    Color.prototype.setByName = function setByName(name, value) {
        if (name === 'r' || name === 'g' || name === 'b') {
            if (this.isValidRGBValue(value) === false)
                return;

            this[name] = value;
            //this.updateHSX();
        }
    };

    Color.prototype.setHSV = function setHSV(hue, saturation, value) {
        this.hue = hue;
        this.saturation = saturation;
        this.value = value;
        this.HSVtoRGB();
    };

    Color.prototype.setHSL = function setHSL(hue, saturation, lightness) {
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
        this.HSLtoRGB();
    };

    Color.prototype.setHue = function setHue(value) {
        if (typeof(value) !== 'number' || isNaN(value) === true ||
            value < 0 || value > 359)
            return;
        this.hue = value;
        this.updateRGB();
        this.ui.parentView.updateRepColor(this);
    };

    Color.prototype.setSaturation = function setSaturation(value) {
        if (typeof(value) !== 'number' || isNaN(value) === true ||
            value < 0 || value > 100)
            return;
        this.saturation = value;
        this.updateRGB();
    };

    Color.prototype.setValue = function setValue(value) {
        if (typeof(value) !== 'number' || isNaN(value) === true ||
            value < 0 || value > 100)
            return;
        this.value = value;
        this.HSVtoRGB();
    };

    Color.prototype.setLightness = function setLightness(value) {
        if (typeof(value) !== 'number' || isNaN(value) === true ||
            value < 0 || value > 100)
            return;
        this.lightness = value;
        this.HSLtoRGB();
    };

    Color.prototype.setHexa = function setHexa(value) {
        var valid = /(^#{0,1}[0-9A-F]{6}$)|(^#{0,1}[0-9A-F]{3}$)/i.test(value);

        if (valid !== true)
            return;

        if (value[0] === '#')
            value = value.slice(1, value.length);

        if (value.length === 3)
            value = value.replace(/([0-9A-F])([0-9A-F])([0-9A-F])/i, '$1$1$2$2$3$3');

        this.r = parseInt(value.substr(0, 2), 16);
        this.g = parseInt(value.substr(2, 2), 16);
        this.b = parseInt(value.substr(4, 2), 16);

        this.alpha = 1;
        this.RGBtoHSV();
    };

    /*========== Conversion Methods ==========*/

    Color.prototype.convertToHSL = function convertToHSL() {
        if (this.format === 'HSL')
            return;

        this.setFormat('HSL');
        this.RGBtoHSL();
    };

    Color.prototype.convertToHSV = function convertToHSV() {
        if (this.format === 'HSV')
            return;

        this.setFormat('HSV');
        this.RGBtoHSV();
    };

    /*========== Update Methods ==========*/

    Color.prototype.updateRGB = function updateRGB() {
        if (this.format === 'HSV') {
            this.HSVtoRGB();
            return;
        }

        if (this.format === 'HSL') {
            this.HSLtoRGB();
            return;
        }
    };

    Color.prototype.updateHSX = function updateHSX() {
        if (this.format === 'HSV') {
            this.RGBtoHSV();
            return;
        }

        if (this.format === 'HSL') {
            this.RGBtoHSL();
            return;
        }
    };

    Color.prototype.HSVtoRGB = function HSVtoRGB() {
        var sat = this.saturation / 100;
        var value = this.value / 100;
        var C = sat * value;
        var H = this.hue / 60;
        var X = C * (1 - Math.abs(H % 2 - 1));
        var m = value - C;
        var precision = 255;

        C = (C + m) * precision | 0;
        X = (X + m) * precision | 0;
        m = m * precision | 0;

        if (H >= 0 && H < 1) {
            this.setRGBA(C, X, m);
            return;
        }
        if (H >= 1 && H < 2) {
            this.setRGBA(X, C, m);
            return;
        }
        if (H >= 2 && H < 3) {
            this.setRGBA(m, C, X);
            return;
        }
        if (H >= 3 && H < 4) {
            this.setRGBA(m, X, C);
            return;
        }
        if (H >= 4 && H < 5) {
            this.setRGBA(X, m, C);
            return;
        }
        if (H >= 5 && H < 6) {
            this.setRGBA(C, m, X);
            return;
        }
    };

    Color.prototype.HSLtoRGB = function HSLtoRGB() {
        var sat = this.saturation / 100;
        var light = this.lightness / 100;
        var C = sat * (1 - Math.abs(2 * light - 1));
        var H = this.hue / 60;
        var X = C * (1 - Math.abs(H % 2 - 1));
        var m = light - C / 2;
        var precision = 255;

        C = (C + m) * precision | 0;
        X = (X + m) * precision | 0;
        m = m * precision | 0;

        if (H >= 0 && H < 1) {
            this.setRGBA(C, X, m);
            return;
        }
        if (H >= 1 && H < 2) {
            this.setRGBA(X, C, m);
            return;
        }
        if (H >= 2 && H < 3) {
            this.setRGBA(m, C, X);
            return;
        }
        if (H >= 3 && H < 4) {
            this.setRGBA(m, X, C);
            return;
        }
        if (H >= 4 && H < 5) {
            this.setRGBA(X, m, C);
            return;
        }
        if (H >= 5 && H < 6) {
            this.setRGBA(C, m, X);
            return;
        }
    };

    Color.prototype.RGBtoHSV = function RGBtoHSV() {
        var red = this.r / 255;
        var green = this.g / 255;
        var blue = this.b / 255;

        var cmax = Math.max(red, green, blue);
        var cmin = Math.min(red, green, blue);
        var delta = cmax - cmin;
        var hue = 0;
        var saturation = 0;

        if (delta) {
            if (cmax === red) {
                hue = ((green - blue) / delta);
            }
            if (cmax === green) {
                hue = 2 + (blue - red) / delta;
            }
            if (cmax === blue) {
                hue = 4 + (red - green) / delta;
            }
            if (cmax) saturation = delta / cmax;
        }

        this.hue = 60 * hue | 0;
        if (this.hue < 0) this.hue += 360;
        this.saturation = (saturation * 100) | 0;
        this.value = (cmax * 100) | 0;
    };

    Color.prototype.RGBtoHSL = function RGBtoHSL() {
        var red = this.r / 255;
        var green = this.g / 255;
        var blue = this.b / 255;

        var cmax = Math.max(red, green, blue);
        var cmin = Math.min(red, green, blue);
        var delta = cmax - cmin;
        var hue = 0;
        var saturation = 0;
        var lightness = (cmax + cmin) / 2;
        var X = (1 - Math.abs(2 * lightness - 1));

        if (delta) {
            if (cmax === red) {
                hue = ((green - blue) / delta);
            }
            if (cmax === green) {
                hue = 2 + (blue - red) / delta;
            }
            if (cmax === blue) {
                hue = 4 + (red - green) / delta;
            }
            if (cmax) saturation = delta / X;
        }

        this.hue = 60 * hue | 0;
        if (this.hue < 0) this.hue += 360;
        this.saturation = (saturation * 100) | 0;
        this.lightness = (lightness * 100) | 0;
    };

    /*========== Get Methods ==========*/

    Color.prototype.getHexa = function getHexa() {
        var r = this.r.toString(16);
        var g = this.g.toString(16);
        var b = this.b.toString(16);
        if (this.r < 16) r = '0' + r;
        if (this.g < 16) g = '0' + g;
        if (this.b < 16) b = '0' + b;
        var value = '#' + r + g + b;
        return value.toUpperCase();
    };

    Color.prototype.getRGBA = function getRGBA() {

        var rgb = '(' + this.r + ', ' + this.g + ', ' + this.b;
        var a = '';
        var v = '';
        var x = parseFloat(this.a);
        if (x !== 1) {
            a = 'a';
            v = ', ' + x;
        }

        var value = 'rgb' + a + rgb + v + ')';
        return value;
    };

    Color.prototype.getHSLA = function getHSLA() {
        if (this.format === 'HSV') {
            var color = new Color(this, this.tool);
            color.setFormat('HSL');
            color.updateHSX();
            return color.getHSLA();
        }

        var a = '';
        var v = '';
        var hsl = '(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%';
        var x = parseFloat(this.a);
        if (x !== 1) {
            a = 'a';
            v = ', ' + x;
        }

        var value = 'hsl' + a + hsl + v + ')';
        return value;
    };

    Color.prototype.getColor = function getColor() {
        if (this.a | 0 === 1)
            return this.getHexa();
        return this.getRGBA();
    };

    /*=======================================================================*/
    /*=======================================================================*/

    /*========== Capture Mouse Movement ==========*/

    var setMouseTracking = function setMouseTracking(elem, callback) {
        elem.addEventListener('mousedown', function (e) {
            elem.style.cursor = 'pointer';
            that.mousedownElement = elem;
            callback(e);
            document.addEventListener('mousemove', callback);
        });

        document.addEventListener('mouseup', function (e) {
            document.removeEventListener('mousemove', callback);
            if (that.mousedownElement) {
                that.mousedownElement.style.cursor = 'initial';
                delete that.mousedownElement;
            }
        });
    };

    /*====================*/
    // Color Picker Class
    /*====================*/

    function ColorPicker(node, tool) {
        this.tool = tool;
        this.color = new Color(null, this.tool);
        this.node = node;
        this.subscribers = [];

        var type = this.node.getAttribute('data-mode');
        var topic = this.node.getAttribute('data-topic');

        this.topic = topic;
        this.picker_mode = (type === 'HSL') ? 'HSL' : 'HSV';
        this.color.setFormat(this.picker_mode);

        this.createPickingArea();
        this.createHueArea();

        // not needed for current implementation - ajk
        //this.newInputComponent('H', 'hue', this.inputChangeHue.bind(this));
        //this.newInputComponent('S', 'saturation', this.inputChangeSaturation.bind(this));
        //this.newInputComponent('V', 'value', this.inputChangeValue.bind(this));
        //this.newInputComponent('L', 'lightness', this.inputChangeLightness.bind(this));


        //this.createAlphaArea();

        //this.newInputComponent('R', 'red', this.inputChangeRed.bind(this));
        //this.newInputComponent('G', 'green', this.inputChangeGreen.bind(this));
        //this.newInputComponent('B', 'blue', this.inputChangeBlue.bind(this));

        //this.createPreviewBox();
        //this.createChangeModeButton();

        //this.newInputComponent('alpha', 'alpha', this.inputChangeAlpha.bind(this));
        //this.newInputComponent('hexa', 'hexa', this.inputChangeHexa.bind(this));
        var color = new Color(null, that);
        color.setHSL(0, 51, 51);
        //Autodesk.Nano.UIColorPicker.setColor('picker', color);
        this.setColor(color);
        pickers[topic] = this;
    }

    /*************************************************************************/
    //				Function for generating the color-picker
    /*************************************************************************/

    ColorPicker.prototype.createPickingArea = function createPickingArea() {
        var area = document.createElement('div');
        var picker = document.createElement('div');

        area.className = 'picking-area';
        picker.className = 'picker';

        this.picking_area = area;
        this.color_picker = picker;
        setMouseTracking(area, this.updateColor.bind(this));

        area.appendChild(picker);
        this.node.appendChild(area);
    };

    ColorPicker.prototype.createHueArea = function createHueArea() {
        var area = document.createElement('div');
        var picker = document.createElement('div');

        area.className = 'hue';
        picker.className = 'slider-picker';

        this.hue_area = area;
        this.hue_picker = picker;
        setMouseTracking(area, this.updateHueSlider.bind(this));

        area.appendChild(picker);
        this.node.appendChild(area);
        //this.node.insertBefore(area,this.picking_area);
    };

    ColorPicker.prototype.createAlphaArea = function createAlphaArea() {
        var area = document.createElement('div');
        var mask = document.createElement('div');
        var picker = document.createElement('div');

        area.className = 'alpha';
        mask.className = 'alpha-mask';
        picker.className = 'slider-picker';

        this.alpha_area = area;
        this.alpha_mask = mask;
        this.alpha_picker = picker;
        setMouseTracking(area, this.updateAlphaSlider.bind(this));

        area.appendChild(mask);
        mask.appendChild(picker);
        this.node.appendChild(area);
    };

    ColorPicker.prototype.createPreviewBox = function createPreviewBox(e) {
        var preview_box = document.createElement('div');
        var preview_color = document.createElement('div');

        preview_box.className = 'preview';
        preview_color.className = 'preview-color';

        this.preview_color = preview_color;

        preview_box.appendChild(preview_color);
        this.node.appendChild(preview_box);
    };

    ColorPicker.prototype.newInputComponent = function newInputComponent(title, topic, onChangeFunc) {
        var wrapper = document.createElement('div');
        var input = document.createElement('input');
        var info = document.createElement('span');

        wrapper.className = 'input';
        wrapper.setAttribute('data-topic', topic);
        info.textContent = title;
        info.className = 'name';
        input.setAttribute('type', 'text');

        wrapper.appendChild(info);
        wrapper.appendChild(input);
        this.node.appendChild(wrapper);

        input.addEventListener('change', onChangeFunc);
        input.addEventListener('click', function () {
            this.select();
        });

        this.subscribe(topic, function (value) {
            input.value = value;
        });
    };

    ColorPicker.prototype.createChangeModeButton = function createChangeModeButton() {

        var button = document.createElement('div');
        button.className = 'switch_mode';
        button.addEventListener('click', function () {
            if (this.picker_mode === 'HSV')
                this.setPickerMode('HSL');
            else
                this.setPickerMode('HSV');

        }.bind(this));

        this.node.appendChild(button);
    };

    /*************************************************************************/
    //					Updates properties of UI elements
    /*************************************************************************/

    ColorPicker.prototype.updateColor = function updateColor(e) {
        var dialogDiv = document.querySelector('#dialogDiv');
        var x = e.pageX - (dialogDiv.offsetLeft + this.picking_area.offsetLeft);
        var y = e.pageY - (dialogDiv.offsetTop + this.picking_area.offsetTop);
        var picker_offset = 5;

        // width and height can be different sizes
        var sizeW = this.picking_area.clientWidth;
        var sizeH = this.picking_area.clientHeight;

        if (x > sizeW) x = sizeW;
        if (y > sizeH) y = sizeH;
        if (x < 0) x = 0;
        if (y < 0) y = 0;

        var value = 100 - (y * 100 / sizeH) | 0;
        var saturation = x * 100 / sizeW | 0;

        if (this.picker_mode === 'HSV')
            this.color.setHSV(this.color.hue, saturation, value);
        if (this.picker_mode === 'HSL')
            this.color.setHSL(this.color.hue, saturation, value);
        this.tool.parentView.updateRepColor(this.color);
        this.color_picker.style.left = x - picker_offset + 'px';
        this.color_picker.style.top = y - picker_offset + 'px';

        // not needed for current implementation - ajk
        //this.updateAlphaGradient();
        //this.updatePreviewColor();

        this.notify('value', value);
        this.notify('lightness', value);
        this.notify('saturation', saturation);

        this.notify('red', this.color.r);
        this.notify('green', this.color.g);
        this.notify('blue', this.color.b);
        this.notify('hexa', this.color.getHexa());

        notify(this.topic, this.color);
    };

    ColorPicker.prototype.updateHueSlider = function updateHueSlider(e) {
        //var x = e.pageX - this.hue_area.offsetLeft;
        var x = e.pageX - (dialogDiv.offsetLeft + this.hue_area.offsetLeft);
        var width = this.hue_area.clientWidth;
        if (x < 0) x = 0;
        if (x > width) x = width;

        // TODO 360 => 359
        var hue = ((359 * x) / width) | 0;
        // if (hue === 360) hue = 359;

        this.updateSliderPosition(this.hue_picker, x);
        this.setHue(hue);
    };

    ColorPicker.prototype.updateAlphaSlider = function updateAlphaSlider(e) {
        //var x = e.pageX - this.alpha_area.offsetLeft;
        var x = e.offsetX;
        var width = this.alpha_area.clientWidth;

        if (x < 0) x = 0;
        if (x > width) x = width;

        this.color.a = (x / width).toFixed(2);

        this.updateSliderPosition(this.alpha_picker, x);
        // not needed for current implementation - ajk
        //this.updatePreviewColor();

        this.notify('alpha', this.color.a);
        notify(this.topic, this.color);
    };

    ColorPicker.prototype.setHue = function setHue(value) {
        this.color.setHue(value);

        this.updatePickerBackground();
        //this.updateAlphaGradient();
        //this.updatePreviewColor();

        this.notify('red', this.color.r);
        this.notify('green', this.color.g);
        this.notify('blue', this.color.b);
        this.notify('hexa', this.color.getHexa());
        this.notify('hue', this.color.hue);

        notify(this.topic, this.color);
    };

    // Updates when one of Saturation/Value/Lightness changes
    ColorPicker.prototype.updateSLV = function updateSLV() {
        this.updatePickerPosition();
        // not needed for current implementation - ajk
        //this.updateAlphaGradient();
        //this.updatePreviewColor();

        this.notify('red', this.color.r);
        this.notify('green', this.color.g);
        this.notify('blue', this.color.b);
        this.notify('hexa', this.color.getHexa());

        notify(this.topic, this.color);
    };

    /*************************************************************************/
    //				Update positions of various UI elements
    /*************************************************************************/

    ColorPicker.prototype.updatePickerPosition = function updatePickerPosition() {
        var sizeW = this.picking_area.clientWidth;
        var sizeH = this.picking_area.clientHeight;
        var value = 0;
        var offset = 5;

        if (this.picker_mode === 'HSV')
            value = this.color.value;
        if (this.picker_mode === 'HSL')
            value = this.color.lightness;

        var x = (this.color.saturation * sizeW / 100) | 0;
        var y = sizeH - (value * sizeH / 100) | 0;

        this.color_picker.style.left = x - offset + 'px';
        this.color_picker.style.top = y - offset + 'px';
    };

    ColorPicker.prototype.updateSliderPosition = function updateSliderPosition(elem, pos) {
        elem.style.left = Math.max(pos - 3, -2) + 'px';
    };

    ColorPicker.prototype.updateHuePicker = function updateHuePicker() {
        var size = this.hue_area.clientWidth;
        var offset = 1;
        var pos = (this.color.hue * size / 360 ) | 0;
        this.hue_picker.style.left = pos - offset + 'px';
    };

    ColorPicker.prototype.updateAlphaPicker = function updateAlphaPicker() {
        var size = this.alpha_area.clientWidth;
        var offset = 1;
        var pos = (this.color.a * size) | 0;
        this.alpha_picker.style.left = pos - offset + 'px';
    };

    /*************************************************************************/
    //						Update background colors
    /*************************************************************************/

    ColorPicker.prototype.updatePickerBackground = function updatePickerBackground() {
        var nc = new Color(this.color, this.tool);
        nc.setHSV(nc.hue, 100, 100);
        this.picking_area.style.backgroundColor = nc.getHexa();
    };

    ColorPicker.prototype.updateAlphaGradient = function updateAlphaGradient() {
        this.alpha_mask.style.backgroundColor = this.color.getHexa();
    };

    ColorPicker.prototype.updatePreviewColor = function updatePreviewColor() {
        this.preview_color.style.backgroundColor = this.color.getColor();
    };

    /*************************************************************************/
    //						Update input elements
    /*************************************************************************/

    ColorPicker.prototype.inputChangeHue = function inputChangeHue(e) {
        var value = parseInt(e.target.value);
        this.setHue(value);
        this.updateHuePicker();
    };

    ColorPicker.prototype.inputChangeSaturation = function inputChangeSaturation(e) {
        var value = parseInt(e.target.value);
        this.color.setSaturation(value);
        e.target.value = this.color.saturation;
        //this.updateSLV();
    };

    ColorPicker.prototype.inputChangeValue = function inputChangeValue(e) {
        var value = parseInt(e.target.value);
        this.color.setValue(value);
        e.target.value = this.color.value;
        //this.updateSLV();
    };

    ColorPicker.prototype.inputChangeLightness = function inputChangeLightness(e) {
        var value = parseInt(e.target.value);
        this.color.setLightness(value);
        e.target.value = this.color.lightness;
        //this.updateSLV();
    };

    ColorPicker.prototype.inputChangeRed = function inputChangeRed(e) {
        var value = parseInt(e.target.value);
        this.color.setByName('r', value);
        e.target.value = this.color.r;
        this.setColor(this.color);
    };

    ColorPicker.prototype.inputChangeGreen = function inputChangeGreen(e) {
        var value = parseInt(e.target.value);
        this.color.setByName('g', value);
        e.target.value = this.color.g;
        this.setColor(this.color);
    };

    ColorPicker.prototype.inputChangeBlue = function inputChangeBlue(e) {
        var value = parseInt(e.target.value);
        this.color.setByName('b', value);
        e.target.value = this.color.b;
        this.setColor(this.color);
    };

    ColorPicker.prototype.inputChangeAlpha = function inputChangeAlpha(e) {
        var value = parseFloat(e.target.value);

        if (typeof value === 'number' && isNaN(value) === false &&
            value >= 0 && value <= 1)
            this.color.a = value.toFixed(2);

        e.target.value = this.color.a;
        this.updateAlphaPicker();
    };

    ColorPicker.prototype.inputChangeHexa = function inputChangeHexa(e) {
        var value = e.target.value;
        this.color.setHexa(value);
        this.setColor(this.color);
    };

    /*************************************************************************/
    //							Internal Pub/Sub
    /*************************************************************************/

    ColorPicker.prototype.subscribe = function subscribe(topic, callback) {
        this.subscribers[topic] = callback;
    };

    ColorPicker.prototype.notify = function notify(topic, value) {
        if (this.subscribers[topic])
            this.subscribers[topic](value);
    };

    /*************************************************************************/
    //							Set Picker Properties
    /*************************************************************************/

    ColorPicker.prototype.setColor = function setColor(color) {
        if (color instanceof Color !== true) {
            console.log('Typeof parameter not Color');
            return;
        }

        if (color.format !== this.picker_mode) {
            color.setFormat(this.picker_mode);
            color.updateHSX();
        }

        this.color.copy(color);
        this.updateHuePicker();
        this.updatePickerPosition();
        this.updatePickerBackground();
        // not needed for current implementation - ajk
        //this.updateAlphaPicker();
        //this.updateAlphaGradient();
        //this.updatePreviewColor();

        this.notify('red', this.color.r);
        this.notify('green', this.color.g);
        this.notify('blue', this.color.b);

        this.notify('hue', this.color.hue);
        this.notify('saturation', this.color.saturation);
        this.notify('value', this.color.value);
        this.notify('lightness', this.color.lightness);

        this.notify('alpha', this.color.a);
        this.notify('hexa', this.color.getHexa());
        notify(this.topic, this.color);
    };

    ColorPicker.prototype.setPickerMode = function setPickerMode(mode) {
        if (mode !== 'HSV' && mode !== 'HSL')
            return;

        this.picker_mode = mode;
        this.node.setAttribute('data-mode', this.picker_mode);
        this.setColor(this.color);
    };

    /*************************************************************************/
    //								UNUSED
    /*************************************************************************/

    var setPickerMode = function setPickerMode(topic, mode) {
        if (pickers[topic])
            pickers[topic].setPickerMode(mode);
    };

    var setColor = function setColor(topic, color) {
        if (pickers[topic])
            pickers[topic].setColor(color);
    };

    var getColor = function getColor(topic) {
        if (pickers[topic])
            return new Color(pickers[topic].color, this.tool);
    };

    var subscribe = function subscribe(topic, callback) {
        if (subscribers[topic] === undefined)
            subscribers[topic] = [];

        subscribers[topic].push(callback);
    };

    var unsubscribe = function unsubscribe(callback) {
        subscribers.indexOf(callback);
        subscribers.splice(index, 1);
    };

    var notify = function notify(topic, value) {
        if (subscribers[topic] === undefined || subscribers[topic].length === 0)
            return;

        var color = new Color(value, this.tool);
        for (var i in subscribers[topic])
            subscribers[topic][i](color);
    };

    var init = function init() {
        this.colorPickers = this.colorPickers || [];
        var elem = document.querySelectorAll('.ui-color-picker');
        var size = elem.length;
        var newPicker;
        for (var i = 0; i < size; i++)
            newPicker = new ColorPicker(elem[i], this);
        this.colorPickers.push(newPicker);
    };

    var dtor = function dtor() {
        this.colorPickers = [];
    };

    return {
        init: init,
        dtor: dtor,
        Color: Color,
        RGBColor: RGBColor,
        RGBAColor: RGBAColor,
        HSVColor: HSVColor,
        HSVAColor: HSVAColor,
        HSLColor: HSLColor,
        HSLAColor: HSLAColor,
        setColor: setColor,
        getColor: getColor,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        setPickerMode: setPickerMode,
        parentView: parentView
    };
};


/**
 * UI-SlidersManager
 */

Autodesk.Nano.InputSliderManager = (function InputSliderManager() {

    var subscribers = {};
    var sliders = [];

    var InputComponent = function InputComponent(obj) {
        var input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.style.width = 50 + obj.precision * 10 + 'px';

        input.addEventListener('click', function (e) {
            this.select();
        });

        input.addEventListener('change', function (e) {
            var value = parseFloat(e.target.value);

            if (isNaN(value) === true)
                setValue(obj.topic, obj.value);
            else
                setValue(obj.topic, value);
        });

        return input;
    };

    var SliderComponent = function SliderComponent(obj, sign) {
        var slider = document.createElement('div');
        var startX = null;
        var start_value = 0;

        slider.addEventListener("click", function (e) {
            document.removeEventListener("mousemove", sliderMotion);
            setValue(obj.topic, obj.value + obj.step * sign);
        });

        slider.addEventListener("mousedown", function (e) {
            startX = e.clientX;
            start_value = obj.value;
            document.body.style.cursor = "e-resize";

            document.addEventListener("mouseup", slideEnd);
            document.addEventListener("mousemove", sliderMotion);
        });

        var slideEnd = function slideEnd(e) {
            document.removeEventListener("mousemove", sliderMotion);
            document.body.style.cursor = "auto";
            slider.style.cursor = "pointer";
        };

        var sliderMotion = function sliderMotion(e) {
            slider.style.cursor = "e-resize";
            var delta = (e.clientX - startX) / obj.sensivity | 0;
            var value = delta * obj.step + start_value;
            setValue(obj.topic, value);
        };

        return slider;
    };

    var InputSlider = function (node) {
        var min = parseFloat(node.getAttribute('data-min'));
        var max = parseFloat(node.getAttribute('data-max'));
        var step = parseFloat(node.getAttribute('data-step'));
        var value = parseFloat(node.getAttribute('data-value'));
        var topic = node.getAttribute('data-topic');
        var unit = node.getAttribute('data-unit');
        var name = node.getAttribute('data-info');
        var sensivity = node.getAttribute('data-sensivity') | 0;
        var precision = node.getAttribute('data-precision') | 0;

        this.min = isNaN(min) ? 0 : min;
        this.max = isNaN(max) ? 100 : max;
        this.precision = precision >= 0 ? precision : 0;
        this.step = step < 0 || isNaN(step) ? 1 : step.toFixed(precision);
        this.topic = topic;
        this.node = node;
        this.unit = unit === null ? '' : unit;
        this.sensivity = sensivity > 0 ? sensivity : 5;
        value = isNaN(value) ? this.min : value;

        var input = new InputComponent(this);
        var slider_left = new SliderComponent(this, -1);
        var slider_right = new SliderComponent(this, 1);

        slider_left.className = 'ui-input-slider-left';
        slider_right.className = 'ui-input-slider-right';

        if (name) {
            var info = document.createElement('span');
            info.className = 'ui-input-slider-info';
            info.textContent = name;
            node.appendChild(info);
        }

        node.appendChild(slider_left);
        node.appendChild(input);
        node.appendChild(slider_right);

        this.input = input;
        sliders[topic] = this;
        setValue(topic, value);
    };

    InputSlider.prototype.setInputValue = function setInputValue() {
        this.input.value = this.value.toFixed(this.precision) + this.unit;
    };

    var setValue = function setValue(topic, value, send_notify) {
        var slider = sliders[topic];
        if (slider === undefined)
            return;

        value = parseFloat(value.toFixed(slider.precision));

        if (value > slider.max) value = slider.max;
        if (value < slider.min)    value = slider.min;

        slider.value = value;
        slider.node.setAttribute('data-value', value);

        slider.setInputValue();

        if (send_notify === false)
            return;

        notify.call(slider);
    };

    var setMax = function setMax(topic, value) {
        var slider = sliders[topic];
        if (slider === undefined)
            return;

        slider.max = value;
        setValue(topic, slider.value);
    };

    var setMin = function setMin(topic, value) {
        var slider = sliders[topic];
        if (slider === undefined)
            return;

        slider.min = value;
        setValue(topic, slider.value);
    };

    var setUnit = function setUnit(topic, unit) {
        var slider = sliders[topic];
        if (slider === undefined)
            return;

        slider.unit = unit;
        setValue(topic, slider.value);
    };

    var setStep = function setStep(topic, value) {
        var slider = sliders[topic];
        if (slider === undefined)
            return;

        slider.step = parseFloat(value);
        setValue(topic, slider.value);
    };

    var setPrecision = function setPrecision(topic, value) {
        var slider = sliders[topic];
        if (slider === undefined)
            return;

        value = value | 0;
        slider.precision = value;

        var step = parseFloat(slider.step.toFixed(value));
        if (step === 0)
            slider.step = 1 / Math.pow(10, value);

        setValue(topic, slider.value);
    };

    var setSensivity = function setSensivity(topic, value) {
        var slider = sliders[topic];
        if (slider === undefined)
            return;

        value = value | 0;

        slider.sensivity = value > 0 ? value : 5;
    };

    var getNode = function getNode(topic) {
        return sliders[topic].node;
    };

    var getPrecision = function getPrecision(topic) {
        return sliders[topic].precision;
    };

    var getStep = function getStep(topic) {
        return sliders[topic].step;
    };

    var subscribe = function subscribe(topic, callback) {
        if (subscribers[topic] === undefined)
            subscribers[topic] = [];
        subscribers[topic].push(callback);
    };

    var unsubscribe = function unsubscribe(topic, callback) {
        subscribers[topic].indexOf(callback);
        subscribers[topic].splice(index, 1);
    };

    var notify = function notify() {
        if (subscribers[this.topic] === undefined)
            return;
        for (var i = 0; i < subscribers[this.topic].length; i++)
            subscribers[this.topic][i](this.value);
    };

    var createSlider = function createSlider(topic, label) {
        var slider = document.createElement('div');
        slider.className = 'ui-input-slider';
        slider.setAttribute('data-topic', topic);

        if (label !== undefined)
            slider.setAttribute('data-info', label);

        new InputSlider(slider);
        return slider;
    };

    var init = function init() {
        var elem = document.querySelectorAll('.ui-input-slider');
        var size = elem.length;
        for (var i = 0; i < size; i++)
            new InputSlider(elem[i]);
    };

    return {
        init: init,
        setMax: setMax,
        setMin: setMin,
        setUnit: setUnit,
        setStep: setStep,
        getNode: getNode,
        getStep: getStep,
        setValue: setValue,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        setPrecision: setPrecision,
        setSensivity: setSensivity,
        getPrecision: getPrecision,
        createSlider: createSlider,
    };

})();


'use strict';

Autodesk.Nano.ColorPickerTool = function ColorPickerTool(ui) {
    /*========== Get DOM Element By ID ==========*/

    function getElemById(id) {
        return document.getElementById(id);
    }

    function allowDropEvent(e) {
        e.preventDefault();
    }

    /*========== Make an element resizable relative to it's parent ==========*/

    var UIComponent = (function UIComponent() {

        function makeResizable(elem, axis) {
            var valueX = 0;
            var valueY = 0;
            var action = 0;

            var resizeStart = function resizeStart(e) {
                e.stopPropagation();
                e.preventDefault();
                if (e.button !== 0)
                    return;

                valueX = e.clientX - elem.clientWidth;
                valueY = e.clientY - elem.clientHeight;

                document.body.setAttribute('data-resize', axis);
                document.addEventListener('mousemove', mouseMove);
                document.addEventListener('mouseup', resizeEnd);
            };

            var mouseMove = function mouseMove(e) {
                if (action >= 0)
                    elem.style.width = e.clientX - valueX + 'px';
                if (action <= 0)
                    elem.style.height = e.clientY - valueY + 'px';
            };

            var resizeEnd = function resizeEnd(e) {
                if (e.button !== 0)
                    return;

                document.body.removeAttribute('data-resize', axis);
                document.removeEventListener('mousemove', mouseMove);
                document.removeEventListener('mouseup', resizeEnd);
            };

            var handle = document.createElement('div');
            handle.className = 'resize-handle';

            if (axis === 'width') action = 1;
            else if (axis === 'height') action = -1;
            else axis = 'both';

            handle.className = 'resize-handle';
            handle.setAttribute('data-resize', axis);
            handle.addEventListener('mousedown', resizeStart);
            elem.appendChild(handle);
        };

        /*========== Make an element draggable relative to it's parent ==========*/

        var makeDraggable = function makeDraggable(elem, endFunction) {

            var offsetTop;
            var offsetLeft;

            elem.setAttribute('data-draggable', 'true');

            var dragStart = function dragStart(e) {
                e.preventDefault();
                e.stopPropagation();

                if (e.target.getAttribute('data-draggable') !== 'true' ||
                    e.target !== elem || e.button !== 0)
                    return;

                offsetLeft = e.clientX - elem.offsetLeft;
                offsetTop = e.clientY - elem.offsetTop;

                document.addEventListener('mousemove', mouseDrag);
                document.addEventListener('mouseup', dragEnd);
            };

            var dragEnd = function dragEnd(e) {
                if (e.button !== 0)
                    return;

                document.removeEventListener('mousemove', mouseDrag);
                document.removeEventListener('mouseup', dragEnd);
            };

            var mouseDrag = function mouseDrag(e) {
                elem.style.left = e.clientX - offsetLeft + 'px';
                elem.style.top = e.clientY - offsetTop + 'px';
            };

            elem.addEventListener('mousedown', dragStart, false);
        };

        return {
            makeResizable: makeResizable,
            makeDraggable: makeDraggable
        };

    })();

    /*========== Color Class ==========*/


    var Color = ui.Color;
    var HSLColor = ui.HSLColor;
    /**
     * ColorPalette
     */
    var ColorPalette = (function ColorPalette() {

        var samples = [];
        var color_palette;
        var complementary;

        var hideNode = function (node) {
            node.setAttribute('data-hidden', 'true');
        };

        var ColorSample = function ColorSample(id) {
            var node = document.createElement('div');
            node.className = 'sample';

            this.uid = samples.length;
            this.node = node;
            this.color = new Color(null, this.tool);

            node.setAttribute('sample-id', this.uid);
            node.setAttribute('draggable', 'true');
            node.addEventListener('dragstart', this.dragStart.bind(this));
            node.addEventListener('click', this.pickColor.bind(this));

            samples.push(this);
        };

        ColorSample.prototype.updateBgColor = function updateBgColor() {
            this.node.style.backgroundColor = this.color.getColor();
        };

        ColorSample.prototype.updateColor = function updateColor(color) {
            this.color.copy(color);
            this.updateBgColor();
        };

        ColorSample.prototype.updateHue = function updateHue(color, degree, steps) {
            this.color.copy(color);
            var hue = (steps * degree + this.color.hue) % 360;
            if (hue < 0) hue += 360;
            this.color.setHue(hue);
            this.updateBgColor();
        };

        ColorSample.prototype.updateSaturation = function updateSaturation(color, value, steps) {
            var saturation = color.saturation + value * steps;
            if (saturation <= 0) {
                this.node.setAttribute('data-hidden', 'true');
                return;
            }

            this.node.removeAttribute('data-hidden');
            this.color.copy(color);
            this.color.setSaturation(saturation);
            this.updateBgColor();
        };

        ColorSample.prototype.updateLightness = function updateLightness(color, value, steps) {
            var lightness = color.lightness + value * steps;
            if (lightness <= 0) {
                this.node.setAttribute('data-hidden', 'true');
                return;
            }
            this.node.removeAttribute('data-hidden');
            this.color.copy(color);
            this.color.setLightness(lightness);
            this.updateBgColor();
        };

        ColorSample.prototype.updateBrightness = function updateBrightness(color, value, steps) {
            var brightness = color.value + value * steps;
            if (brightness <= 0) {
                this.node.setAttribute('data-hidden', 'true');
                return;
            }
            this.node.removeAttribute('data-hidden');
            this.color.copy(color);
            this.color.setValue(brightness);
            this.updateBgColor();
        };

        ColorSample.prototype.updateAlpha = function updateAlpha(color, value, steps) {
            var alpha = parseFloat(color.a) + value * steps;
            if (alpha <= 0) {
                this.node.setAttribute('data-hidden', 'true');
                return;
            }
            this.node.removeAttribute('data-hidden');
            this.color.copy(color);
            this.color.a = parseFloat(alpha.toFixed(2));
            this.updateBgColor();
        };

        ColorSample.prototype.pickColor = function pickColor() {
            Autodesk.Nano.UIColorPicker.setColor('picker', this.color);
        };

        ColorSample.prototype.dragStart = function dragStart(e) {
            e.dataTransfer.setData('sampleID', this.uid);
            e.dataTransfer.setData('location', 'palette-samples');
        };

        var Palette = function Palette(text, size) {
            this.samples = [];
            this.locked = false;

            var palette = document.createElement('div');
            var title = document.createElement('div');
            var controls = document.createElement('div');
            var container = document.createElement('div');
            var lock = document.createElement('div');

            container.className = 'color-picker';
            container.id = 'colorPicker';
            title.className = 'title';
            palette.className = 'palette';
            controls.className = 'controls';
            lock.className = 'lock';
            title.textContent = text;

            controls.appendChild(lock);
            container.appendChild(title);
            container.appendChild(controls);
            container.appendChild(palette);

            lock.addEventListener('click', function () {
                this.locked = !this.locked;
                lock.setAttribute('locked-state', this.locked);
            }.bind(this));

            for (var i = 0; i < size; i++) {
                var sample = new ColorSample();
                this.samples.push(sample);
                palette.appendChild(sample.node);
            }

            this.container = container;
            this.title = title;
        };

        var createHuePalette = function createHuePalette() {
            var palette = new Palette('Hue', 12);

            Autodesk.Nano.UIColorPicker.subscribe('picker', function (color) {
                if (palette.locked === true)
                    return;

                for (var i = 0; i < 12; i++) {
                    palette.samples[i].updateHue(color, 30, i);
                }
            });

            color_palette.appendChild(palette.container);
        };

        var createSaturationPalette = function createSaturationPalette() {
            var palette = new Palette('Saturation', 11);

            Autodesk.Nano.UIColorPicker.subscribe('picker', function (color) {
                if (palette.locked === true)
                    return;

                for (var i = 0; i < 11; i++) {
                    palette.samples[i].updateSaturation(color, -10, i);
                }
            });

            color_palette.appendChild(palette.container);
        };

        /* Brightness or Lightness - depends on the picker mode */
        var createVLPalette = function createSaturationPalette() {
            var palette = new Palette('Lightness', 11);

            Autodesk.Nano.UIColorPicker.subscribe('picker', function (color) {
                if (palette.locked === true)
                    return;

                if (color.format === 'HSL') {
                    palette.title.textContent = 'Lightness';
                    for (var i = 0; i < 11; i++)
                        palette.samples[i].updateLightness(color, -10, i);
                }
                else {
                    palette.title.textContent = 'Value';
                    for (var i = 0; i < 11; i++)
                        palette.samples[i].updateBrightness(color, -10, i);
                }
            });

            color_palette.appendChild(palette.container);
        };

        var isBlankPalette = function isBlankPalette(container, value) {
            if (value === 0) {
                container.setAttribute('data-collapsed', 'true');
                return true;
            }

            container.removeAttribute('data-collapsed');
            return false;
        };

        var createAlphaPalette = function createAlphaPalette() {
            var palette = new Palette('Alpha', 10);

            Autodesk.Nano.UIColorPicker.subscribe('picker', function (color) {
                if (palette.locked === true)
                    return;

                for (var i = 0; i < 10; i++) {
                    palette.samples[i].updateAlpha(color, -0.1, i);
                }
            });

            color_palette.appendChild(palette.container);
        };

        var getSampleColor = function getSampleColor(id) {
            if (samples[id] !== undefined && samples[id] !== null)
                return new Color(samples[id].color, this.tool);
        };

        var init = function init() {
            // not needed for current implementation - ajk
            //color_palette = getElemById('color-palette');
            //
            //createHuePalette();
            //createSaturationPalette();
            //createVLPalette();
            //createAlphaPalette();

        };

        return {
            init: init,
            getSampleColor: getSampleColor
        };

    })();

    /**
     * ColorInfo
     */
    var ColorInfo = (function ColorInfo() {

        var info_box;
        var select;
        var RGBA;
        var HEXA;
        var HSLA;

        var updateInfo = function updateInfo(color) {
            if (color.a | 0 === 1) {
                RGBA.info.textContent = 'RGB';
                HSLA.info.textContent = 'HSL';
            }
            else {
                RGBA.info.textContent = 'RGBA';
                HSLA.info.textContent = 'HSLA';
            }

            RGBA.value.value = color.getRGBA();
            HSLA.value.value = color.getHSLA();
            HEXA.value.value = color.getHexa();
        };

        var InfoProperty = function InfoProperty(info) {

            var node = document.createElement('div');
            var title = document.createElement('div');
            var value = document.createElement('input');
            var copy = document.createElement('div');

            node.className = 'property';
            title.className = 'type';
            value.className = 'value';
            copy.className = 'copy';

            title.textContent = info;
            value.setAttribute('type', 'text');

            copy.addEventListener('click', function () {
                value.select();
            });

            node.appendChild(title);
            node.appendChild(value);
            node.appendChild(copy);

            this.node = node;
            this.value = value;
            this.info = title;

            info_box.appendChild(node);
        };

        var init = function init() {

            info_box = getElemById('color-info');

            RGBA = new InfoProperty('RGBA');
            HSLA = new InfoProperty('HSLA');
            HEXA = new InfoProperty('HEXA');

            Autodesk.Nano.UIColorPicker.subscribe('picker', updateInfo);

        };

        return {
            init: init
        };

    })();

    /**
     * ColorPicker Samples
     */
    var ColorPickerSamples = (function ColorPickerSamples() {

        var samples = [];
        var nr_samples = 0;
        var active = null;
        var container = null;
        var samples_per_line = 10;
        var trash_can = null;
        var base_color = new HSLColor(0, 50, 100);
        var add_btn;
        var add_btn_pos;

        var ColorSample = function ColorSample() {
            var node = document.createElement('div');
            node.className = 'sample';

            this.uid = samples.length;
            this.index = nr_samples++;
            this.node = node;
            this.color = new Color(base_color, this.tool);

            node.setAttribute('sample-id', this.uid);
            node.setAttribute('draggable', 'true');

            node.addEventListener('dragstart', this.dragStart.bind(this));
            node.addEventListener('dragover', allowDropEvent);
            node.addEventListener('drop', this.dragDrop.bind(this));

            this.updatePosition(this.index);
            this.updateBgColor();
            samples.push(this);
        };

        ColorSample.prototype.updateBgColor = function updateBgColor() {
            this.node.style.backgroundColor = this.color.getColor();
        };

        ColorSample.prototype.updatePosition = function updatePosition(index) {
            this.index = index;
            this.posY = 5 + ((index / samples_per_line) | 0) * 52;
            this.posX = 5 + ((index % samples_per_line) | 0) * 52;
            this.node.style.top = this.posY + 'px';
            this.node.style.left = this.posX + 'px';
        };

        ColorSample.prototype.updateColor = function updateColor(color) {
            this.color.copy(color);
            this.updateBgColor();
        };

        ColorSample.prototype.activate = function activate() {
            Autodesk.Nano.UIColorPicker.setColor('picker', this.color);
            this.node.setAttribute('data-active', 'true');
        };

        ColorSample.prototype.deactivate = function deactivate() {
            this.node.removeAttribute('data-active');
        };

        ColorSample.prototype.dragStart = function dragStart(e) {
            e.dataTransfer.setData('sampleID', this.uid);
            e.dataTransfer.setData('location', 'picker-samples');
        };

        ColorSample.prototype.dragDrop = function dragDrop(e) {
            e.stopPropagation();
            this.color = Tool.getSampleColorFrom(e);
            this.updateBgColor();
        };

        ColorSample.prototype.deleteSample = function deleteSample() {
            container.removeChild(this.node);
            samples[this.uid] = null;
            nr_samples--;
        };

        var updateUI = function updateUI() {
            updateContainerProp();

            var index = 0;
            var nr = samples.length;
            for (var i = 0; i < nr; i++)
                if (samples[i] !== null) {
                    samples[i].updatePosition(index);
                    index++;
                }

            AddSampleButton.updatePosition(index);
        };

        var deleteSample = function deleteSample(e) {
            trash_can.parentElement.setAttribute('drag-state', 'none');

            var location = e.dataTransfer.getData('location');
            if (location !== 'picker-samples')
                return;

            var sampleID = e.dataTransfer.getData('sampleID');
            samples[sampleID].deleteSample();
            console.log(samples);

            updateUI();
        };

        var createDropSample = function createDropSample() {
            var sample = document.createElement('div');
            sample.id = 'drop-effect-sample';
            sample.className = 'sample';
            container.appendChild(sample);
        };

        var setActivateSample = function setActivateSample(e) {
            if (e.target.className !== 'sample')
                return;

            unsetActiveSample(active);
            Tool.unsetVoidSample();
            CanvasSamples.unsetActiveSample();
            active = samples[e.target.getAttribute('sample-id')];
            active.activate();
        };

        var unsetActiveSample = function unsetActiveSample() {
            if (active)
                active.deactivate();
            active = null;
        };

        var getSampleColor = function getSampleColor(id) {
            if (samples[id] !== undefined && samples[id] !== null)
                return new Color(samples[id].color, this.tool);
        };

        var updateContainerProp = function updateContainerProp() {
            samples_per_line = ((container.clientWidth - 5) / 52) | 0;
            var height = 52 * (1 + (nr_samples / samples_per_line) | 0);
            container.style.height = height + 10 + 'px';
        };

        var AddSampleButton = (function AddSampleButton() {
            var node;
            var _index = 0;
            var _posX;
            var _posY;

            var updatePosition = function updatePosition(index) {
                _index = index;
                _posY = 5 + ((index / samples_per_line) | 0) * 52;
                _posX = 5 + ((index % samples_per_line) | 0) * 52;

                node.style.top = _posY + 'px';
                node.style.left = _posX + 'px';
            };

            var addButtonClick = function addButtonClick() {
                var sample = new ColorSample();
                container.appendChild(sample.node);
                updatePosition(_index + 1);
                updateUI();
            };

            var init = function init() {
                node = document.createElement('div');
                var icon = document.createElement('div');

                node.className = 'sample';
                icon.id = 'add-icon';
                node.appendChild(icon);
                node.addEventListener('click', addButtonClick);

                updatePosition(0);
                container.appendChild(node);
            };

            return {
                init: init,
                updatePosition: updatePosition
            };
        })();

        var init = function init() {
            container = getElemById('picker-samples');
            trash_can = getElemById('trash-can');

            AddSampleButton.init();

            for (var i = 0; i < 16; i++) {
                var sample = new ColorSample();
                container.appendChild(sample.node);
            }

            AddSampleButton.updatePosition(samples.length);
            updateUI();

            active = samples[0];
            active.activate();

            container.addEventListener('click', setActivateSample);

            trash_can.addEventListener('dragover', allowDropEvent);
            trash_can.addEventListener('dragenter', function () {
                this.parentElement.setAttribute('drag-state', 'enter');
            });
            trash_can.addEventListener('dragleave', function (e) {
                this.parentElement.setAttribute('drag-state', 'none');
            });
            trash_can.addEventListener('drop', deleteSample);

            Autodesk.Nano.UIColorPicker.subscribe('picker', function (color) {
                if (active)
                    active.updateColor(color);
            });

        };

        return {
            init: init,
            getSampleColor: getSampleColor,
            unsetActiveSample: unsetActiveSample
        };

    })();

    /**
     * Canvas Samples
     */
    var CanvasSamples = (function CanvasSamples() {

        var active = null;
        var canvas = null;
        var samples = [];
        var zindex = null;
        var tutorial = true;

        var CanvasSample = function CanvasSample(color, posX, posY) {

            var node = document.createElement('div');
            var pick = document.createElement('div');
            var delete_btn = document.createElement('div');
            node.className = 'sample';
            pick.className = 'pick';
            delete_btn.className = 'delete';

            this.uid = samples.length;
            this.node = node;
            this.color = color;
            this.updateBgColor();
            this.zIndex = 1;

            node.style.top = posY - 50 + 'px';
            node.style.left = posX - 50 + 'px';
            node.setAttribute('sample-id', this.uid);

            node.appendChild(pick);
            node.appendChild(delete_btn);

            var activate = function activate() {
                setActiveSample(this);
            }.bind(this);

            node.addEventListener('dblclick', activate);
            pick.addEventListener('click', activate);
            delete_btn.addEventListener('click', this.deleteSample.bind(this));

            UIComponent.makeDraggable(node);
            UIComponent.makeResizable(node);

            samples.push(this);
            canvas.appendChild(node);
            return this;
        };

        CanvasSample.prototype.updateBgColor = function updateBgColor() {
            this.node.style.backgroundColor = this.color.getColor();
        };

        CanvasSample.prototype.updateColor = function updateColor(color) {
            this.color.copy(color);
            this.updateBgColor();
        };

        CanvasSample.prototype.updateZIndex = function updateZIndex(value) {
            this.zIndex = value;
            this.node.style.zIndex = value;
        };

        CanvasSample.prototype.activate = function activate() {
            this.node.setAttribute('data-active', 'true');
            zindex.setAttribute('data-active', 'true');

            Autodesk.Nano.UIColorPicker.setColor('picker', this.color);
            Autodesk.Nano.InputSliderManager.setValue('z-index', this.zIndex);
        };

        CanvasSample.prototype.deactivate = function deactivate() {
            this.node.removeAttribute('data-active');
            zindex.removeAttribute('data-active');
        };

        CanvasSample.prototype.deleteSample = function deleteSample() {
            if (active === this)
                unsetActiveSample();
            canvas.removeChild(this.node);
            samples[this.uid] = null;
        };

        CanvasSample.prototype.updatePosition = function updatePosition(posX, posY) {
            this.node.style.top = posY - this.startY + 'px';
            this.node.style.left = posX - this.startX + 'px';
        };

        var canvasDropEvent = function canvasDropEvent(e) {
            var color = Tool.getSampleColorFrom(e);

            if (color) {
                //var offsetX = e.pageX - canvas.offsetLeft;
                //var offsetY = e.pageY - canvas.offsetTop;
                var offsetX = e.offsetX;
                var offsetY = e.offsetY;
                var sample = new CanvasSample(color, offsetX, offsetY);
                if (tutorial) {
                    tutorial = false;
                    canvas.removeAttribute('data-tutorial');
                    var info = new CanvasSample(new Color(null, this.tool), 100, 100);
                    info.node.setAttribute('data-tutorial', 'dblclick');
                }
            }

        };

        var setActiveSample = function setActiveSample(sample) {
            ColorPickerSamples.unsetActiveSample();
            Tool.unsetVoidSample();
            unsetActiveSample();
            active = sample;
            active.activate();
        };

        var unsetActiveSample = function unsetActiveSample() {
            if (active)
                active.deactivate();
            active = null;
        };

        var createToggleBgButton = function createToggleBgButton() {
            var button = document.createElement('div');
            var state = false;
            button.className = 'toggle-bg';
            canvas.appendChild(button);

            button.addEventListener('click', function () {
                console.log(state);
                state = !state;
                canvas.setAttribute('data-bg', state);
            });
        };

        var init = function init() {
            canvas = getElemById('canvas');
            zindex = getElemById('zindex');

            canvas.addEventListener('dragover', allowDropEvent);
            canvas.addEventListener('drop', canvasDropEvent);

            createToggleBgButton();

            Autodesk.Nano.UIColorPicker.subscribe('picker', function (color) {
                if (active)    active.updateColor(color);
            });

            Autodesk.Nano.InputSliderManager.subscribe('z-index', function (value) {
                if (active)    active.updateZIndex(value);
            });

            UIComponent.makeResizable(canvas, 'height');
        };

        return {
            init: init,
            unsetActiveSample: unsetActiveSample
        };

    })();

    var StateButton = function StateButton(node, state) {
        this.state = false;
        this.callback = null;

        node.addEventListener('click', function () {
            this.state = !this.state;
            if (typeof this.callback === "function")
                this.callback(this.state);
        }.bind(this));
    };

    StateButton.prototype.set = function set() {
        this.state = true;
        if (typeof this.callback === "function")
            this.callback(this.state);
    };

    StateButton.prototype.unset = function unset() {
        this.state = false;
        if (typeof this.callback === "function")
            this.callback(this.state);
    };

    StateButton.prototype.subscribe = function subscribe(func) {
        this.callback = func;
    };


    /**
     * Tool
     */
    var Tool = (function Tool() {

        var samples = [];
        var controls = null;
        var void_sw;

        var createPickerModeSwitch = function createPickerModeSwitch() {
            var parent = getElemById('controls');
            var icon = document.createElement('div');
            var button = document.createElement('div');
            var hsv = document.createElement('div');
            var hsl = document.createElement('div');
            var active = null;

            icon.className = 'icon picker-icon';
            button.className = 'switch';
            button.appendChild(hsv);
            button.appendChild(hsl);

            hsv.textContent = 'HSV';
            hsl.textContent = 'HSL';

            active = hsl;
            active.setAttribute('data-active', 'true');

            function switchPickingModeTo(elem) {
                active.removeAttribute('data-active');
                active = elem;
                active.setAttribute('data-active', 'true');
                Autodesk.Nano.UIColorPicker.setPickerMode('picker', active.textContent);
            };

            var picker_sw = new StateButton(icon);
            picker_sw.subscribe(function () {
                if (active === hsv)
                    switchPickingModeTo(hsl);
                else
                    switchPickingModeTo(hsv);
            });

            hsv.addEventListener('click', function () {
                switchPickingModeTo(hsv);
            });
            hsl.addEventListener('click', function () {
                switchPickingModeTo(hsl);
            });

            parent.appendChild(icon);
            parent.appendChild(button);
        };

        var setPickerDragAndDrop = function setPickerDragAndDrop() {
            var preview = document.querySelector('#picker .preview-color');
            var picking_area = document.querySelector('#picker .picking-area');

            preview.setAttribute('draggable', 'true');
            preview.addEventListener('drop', drop);
            preview.addEventListener('dragstart', dragStart);
            preview.addEventListener('dragover', allowDropEvent);

            picking_area.addEventListener('drop', drop);
            picking_area.addEventListener('dragover', allowDropEvent);

            function drop(e) {
                var color = getSampleColorFrom(e);
                Autodesk.Nano.UIColorPicker.setColor('picker', color);
            };

            function dragStart(e) {
                e.dataTransfer.setData('sampleID', 'picker');
                e.dataTransfer.setData('location', 'picker');
            };
        };

        var getSampleColorFrom = function getSampleColorFrom(e) {
            var sampleID = e.dataTransfer.getData('sampleID');
            var location = e.dataTransfer.getData('location');

            if (location === 'picker')
                return Autodesk.Nano.UIColorPicker.getColor(sampleID);
            if (location === 'picker-samples')
                return ColorPickerSamples.getSampleColor(sampleID);
            if (location === 'palette-samples')
                return ColorPalette.getSampleColor(sampleID);
        };

        var setVoidSwitch = function setVoidSwitch() {
            var void_sample = getElemById('void-sample');
            void_sw = new StateButton(void_sample);
            void_sw.subscribe(function (state) {
                void_sample.setAttribute('data-active', state);
                if (state === true) {
                    ColorPickerSamples.unsetActiveSample();
                    CanvasSamples.unsetActiveSample();
                }
            });
        };

        var unsetVoidSample = function unsetVoidSample() {
            void_sw.unset();
        };

        var init = function init() {
            controls = getElemById('controls');

            var color = new Color(null, this.tool);
            color.setHSL(0, 51, 51);
            Autodesk.Nano.UIColorPicker.setColor('picker', color);

            // not needed for current implementation - ajk
            //setPickerDragAndDrop();
            //createPickerModeSwitch();
            //setVoidSwitch();
        };

        return {
            init: init,
            unsetVoidSample: unsetVoidSample,
            getSampleColorFrom: getSampleColorFrom
        };

    })();

    var init = function init() {
        ui.init();
        Autodesk.Nano.InputSliderManager.init();
        //not used by current implementation - ajk
        //ColorInfo.init();
        //ColorPalette.init();
        //ColorPickerSamples.init();
        //CanvasSamples.init();
        //Tool.init();
    };

    return {
        init: init,
        ui: ui
    };

};

;/**
 * Created by andrewkimoto on 12/23/15.
 */

Autodesk.Nano.ColorGenerator = function ColorGenerator(h,s,v) {
    this.hue = h ? h : 0;
    this.saturation = s ? s : 90;
    this.value = v ? v : 70;
    this.color = null;
    this.changeVal = true;
};

Autodesk.Nano.ColorGenerator.prototype.getNextColor = function getNextColor() {
    this.color = 'hsl(' + this.hue + ',' + this.saturation + '%,' + this.value + '%)';
    this.hue = this.hue + 71 > 360 ? (this.hue + 71) - 360 : this.hue + 71;
    if(this.changeVal) {
        this.value = this.value - 10 < 20 ? 70 : this.value - 10;
        this.changeVal = false;
    } else {
        this.saturation = this.saturation - 10 < 40 ? 100 : this.saturation - 10;
        this.changeVal = true;
    }
    return this.color;
};

Autodesk.Nano.ColorGenerator.prototype.makeColorBoxes = function makeColorboxes(num) {
    var i,
        div,
        output = document.createElement('div');

    for (i = 0; i < num; i++) {
        div = document.createElement('div');
        div.setAttribute('style','float: left; margin: 20px;height: 10px;width:10px;border:1px solid #000;background-color:'+this.getNextColor())
        output.appendChild(div);
    }
    return output;
};


;Autodesk.Nano.BaseCmd = function(name,options) {
    this._cmdName = name;
};
Autodesk.Nano.BaseCmd.prototype.dtor = function dtor(){

};

Autodesk.Nano.BaseCmd.prototype.dtor = function dtor(){


};
Autodesk.Nano.BaseCmd.prototype.run = function run(){

};

Autodesk.Nano.BaseCmd.prototype.redoIt = function redoIt(){


};


Autodesk.Nano.BaseCmd.prototype.undoIt = function undoIt(){


};

Autodesk.Nano.BaseCmd.prototype.getCmdName = function getCmdName(){
    return this._cmdName;
};
;

/**
 * Cmd Stack
 *
 * @constructor
 */
Autodesk.Nano.CmdStack = function (viewer,options) {
    var _undoStack = [];
    var _redoStack = [];
    var _currentGroup = null;
    var _viewer = viewer;
    var _limit = options && options.limit ? options.limit : 50; //size of stack, need value for infinite!
    var av = Autodesk.Viewing;
    //set up hotkeys
    var _on = true;

    /**
     * Set the limit for the stack
     * @param val
     */
    function setLimit(val){
        _limit = val;
        _checkLimit(_undoStack);
        _checkLimit(_redoStack);
    }

    /**
     * turn the stack on or off
     * This will also automaatically clear the stack
     * @param val
     */
    function turnOff(val){
        val = val ? true : false;
        _on = !val;
    };

    /**
     * Start a group of commands that may be undone as one whole set
     * endGroup must be called after the set of commands that we want to group as one
     * or bad things will happen.
     * We supported nested groups so something like this startGroup, runCmd, startGroup, runCmd, runCmd, endGroup, endGroup
     * would wrap that set as one group.
     */
    function startGroup (){
       var groupCmd = new Autodesk.Nano.GroupCmd();
        if(_currentGroup){
            _currentGroup.addCommand(groupCmd); // set up nested undo/redo
        }
        _currentGroup = groupCmd;
        _pushToStack(_undoStack,groupCmd);
    }

    /**
     * End a group of commads.
     */
    function endGroup(){
        if(_currentGroup.parentGroup){
            _currentGroup = _currentGroup.parentGroup;
        }else{
            _currentGroup = null;
        }
    }

    function runCmd(cmd){ //run and add
        cmd.run();
        if(!_currentGroup) {
            _pushToStack(_undoStack, cmd);
        }else{
            _currentGroup.addCommand(cmd);
        }
    }

    function clearStack(){
        for(var i =0; i < _undoStack.length;++i){
            _undoStack[i].dtor();
        }
        for(var i =0; i < _redoStack.length;++i){
            _redoStack[i].dtor();
        }
        _undoStack = [];
        _redoStack = [];
    }
    function canUndo(){
        return (_undoStack.length > 0);
    }

    function canRedo(){
        return (_redoStack.length > 0);
    }

    function undo(){
        if(canUndo()){
            var cmd = _undoStack.pop();
            cmd.undoIt();
            _pushToStack(_redoStack,cmd);
        }
    }

    function redo(){
        if(canRedo()){
            var cmd = _redoStack.pop();
            cmd.redoIt();
            _pushToStack(_undoStack,cmd);
        }
    }
    function getViewer(){
        return _viewer;
    }

    function _pushToStack(stack,cmd){
        stack.push(cmd);
        _checkLimit(stack);
    }

    function _checkLimit(stack) {
        if (stack.length > _limit) {
            stack.splice(_limit, stack.length - _limit);
        }
    }

    function onPressRedo(){
        redo();
    }

    function onPressUndo(){
        undo();
    }
    var hotkeys = [
        {
            keycodes: [av.theHotkeyManager.KEYCODES.CONTROL, av.theHotkeyManager.KEYCODES.SHIFT, av.theHotkeyManager.KEYCODES.z],
            onPress: onPressRedo
        },
        {
            keycodes: [av.theHotkeyManager.KEYCODES.CONTROL, av.theHotkeyManager.KEYCODES.z],
            onPress: onPressUndo
        }
    ];

    av.theHotkeyManager.pushHotkeys("CmdStack HotKeys", hotkeys);

    return {
        setLimit: setLimit,
        turnOff: turnOff,
        runCmd: runCmd,
        clearStack: clearStack,
        canUndo: canUndo,
        undo: undo,
        redo: redo,
        startGroup: startGroup,
        endGroup: endGroup
    };

};
;/**
 * This is a special command used to nest together a set of commands as one set
 *
 */


Autodesk.Nano.GroupCmd = function(options) {
    this._cmdName = name;
    Autodesk.Nano.BaseCmd.call(this,'groupcmd',options);
    this.commands = []; //the commands in this group
    this.isGroup = true;

};

Autodesk.Nano.GroupCmd.prototype = Object.create(Autodesk.Nano.BaseCmd.prototype);
Autodesk.Nano.GroupCmd.prototype.constructor = Autodesk.Nano.BaseCmd;

/**
 * When overridden may also need to remove materials!
 */
Autodesk.Nano.GroupCmd.prototype.redoIt = function redoIt(){
    for(var i = 0; i < this.commands.length;++i){
        this.commands[i].redoIt();
    }

};


Autodesk.Nano.GroupCmd.prototype.undoIt = function undoIt(){
    for(var i = this.commands.length -1; i > -1; --i){
        this.commands[i].undoIt();
    }
};


Autodesk.Nano.GroupCmd.prototype.addCommand = function addCommand(cmd){
    this.commands.push(cmd);
    if(cmd.isGroup){
        cmd.parentGroup = this; //needed for nested out
    }
}

;
(function() {

"use strict";

var av = Autodesk.Viewing,
    avu = Autodesk.Viewing.UI;


/**
 * Base class for UI controls.
 *
 * It is abstract and should not be instantiated directly.
 * @param {string} [id] - The id for this control. Optional.
 * @param {object} [options] - An optional dictionary of options.
 * @param {boolean} [options.collapsible=true] - Whether this control is collapsible.
 * @constructor
 * @abstract
 * @memberof Autodesk.Viewing.UI
 * @category UI
 */
function Control(id, options) {
    this._id = id;
    this._isCollapsible = !options || options.collapsible;

    this._toolTipElement = null;

    this._listeners = {};

    this.container = document.createElement('div');
    this.container.id = id;
    this.addClass('adsk-control');
};

/**
 * Enum for control event IDs.
 * @readonly
 * @enum {String}
 */
Control.Event = {
    VISIBILITY_CHANGED: 'Control.VisibilityChanged',
    COLLAPSED_CHANGED: 'Control.CollapsedChanged'
};

/**
 * Event fired when the visibility of the control changes.
 *
 * @event Autodesk.Viewing.UI.Control#VISIBILITY_CHANGED
 * @type {object}
 * @property {string} controlId - The ID of the control that fired this event.
 * @property {boolean} isVisible - True if the control is now visible.
 */

/**
 * Event fired when the collapsed state of the control changes.
 *
 * @event Autodesk.Viewing.UI.Control#COLLAPSED_CHANGED
 * @type {object}
 * @property {string} controlId - The ID of the control that fired this event.
 * @property {boolean} isCollapsed - True if the control is now collapsed.
 */

av.EventDispatcher.prototype.apply(Control.prototype);
Control.prototype.constructor = Control;

/**
 * The HTMLElement representing this control.
 *
 * @type {HTMLElement}
 * @public
 */
Control.prototype.container = null;

/**
 * Gets this control's ID.
 *
 * @returns {string} The control's ID.
 */
Control.prototype.getId = function() {
    return this._id;
};

/**
 * Sets the visibility of this control.
 *
 * @param {boolean} visible - The visibility value to set.
 * @returns {boolean} True if the control's visibility changed.
 * @fires Autodesk.Viewing.UI.Control#VISIBILITY_CHANGED
 */
Control.prototype.setVisible = function(visible) {
    var isVisible = !this.container.classList.contains('adsk-hidden');

    if (isVisible === visible) {
        return false;
    }

    if (visible) {
        this.container.classList.remove('adsk-hidden');
    } else {
        this.container.classList.add('adsk-hidden');
    }

    var event = {
        type: Control.Event.VISIBILITY_CHANGED,
        target: this,
        controlId: this._id,
        isVisible: visible
    };

    this.fireEvent(event);

    return true;
};

/**
 * Gets the visibility of this control.
 * @returns {boolean} True if the this control is visible.
 */
Control.prototype.isVisible = function() {
    return !this.container.classList.contains('adsk-hidden');
};

/**
 * Sets the tooltip text for this control.
 * @param {string} toolTipText - The text for the tooltip.
 * @returns {boolean} True if the tooltip was successfully set.
 */
Control.prototype.setToolTip = function(toolTipText) {
    if (this._toolTipElement && this._toolTipElement.getAttribute("tooltipText") === toolTipText) {
        return false;
    }

    if (!this._toolTipElement) {
        this._toolTipElement = document.createElement('div');
        this._toolTipElement.id = this._id + '-tooltip';
        this._toolTipElement.classList.add('adsk-control-tooltip');
        this.container.appendChild(this._toolTipElement);
    }

    this._toolTipElement.setAttribute("data-i18n", toolTipText);
    this._toolTipElement.setAttribute("tooltipText", toolTipText);
    this._toolTipElement.textContent = Autodesk.Viewing.i18n.translate(toolTipText, { defaultValue: toolTipText });

    return true;
};

/**
 * Returns the tooltip text for this control.
 * @returns {string} The tooltip text. Null if it's not set.
 */
Control.prototype.getToolTip = function() {
    return this._toolTipElement && this._toolTipElement.getAttribute("tooltipText");
};

/**
 * Sets the collapsed state of this control.
 * @param {boolean} collapsed - The collapsed value to set.
 * @returns {boolean} True if the control's collapsed state changes.
 * @fires Autodesk.Viewing.UI.Control#COLLAPSED_CHANGED
 */
Control.prototype.setCollapsed = function(collapsed) {
    if (!this._isCollapsible || this.isCollapsed() === collapsed) {
        return false;
    }

    if (collapsed) {
        this.container.classList.add('collapsed');
    } else {
        this.container.classList.remove('collapsed');
    }

    var event = {
        type: Control.Event.COLLAPSED_CHANGED,
        isCollapsed: collapsed
    };

    this.fireEvent(event);

    return true;
};

/**
 * Gets the collapsed state of this control.
 * @returns {boolean} True if this control is collapsed.
 */
Control.prototype.isCollapsed = function() {
    return !!this.container.classList.contains('collapsed');
};

/**
 * Returns whether or not this control is collapsible.
 * @returns {boolean} True if this control can be collapsed.
 */
Control.prototype.isCollapsible = function() {
    return this._isCollapsible;
};

/**
 * Adds a CSS class to this control.
 * @param {string} cssClass - The name of the CSS class.
 *
 */
Control.prototype.addClass = function(cssClass) {
    this.container.classList.add(cssClass);
};

/**
 * Removes a CSS class from this control.
 * @param {string} cssClass - The name of the CSS class.
 */
Control.prototype.removeClass = function(cssClass) {

    this.container.classList.remove(cssClass);

};
    
/**
 * Returns the position of this control relative to the canvas.
 * @returns {object} The top and left values of the toolbar.
 */
Control.prototype.getPosition = function() {
    var clientRect = this.container.getBoundingClientRect();

    return {top: clientRect.top, left: clientRect.left};
};

/**
 * Returns the dimensions of this control.
 * @returns {object} The width and height of the toolbar.
 */
Control.prototype.getDimensions = function() {
    var clientRect = this.container.getBoundingClientRect();

    return {width: clientRect.width, height: clientRect.height};
};

Control.prototype.setDisplay = function(value) {
    this.container.style.display = value;
};

Autodesk.Viewing.UI.Control = Control;

})();
;
(function() {

"use strict";

var avu = Autodesk.Viewing.UI;

/**
 * Class for grouping controls.
 *
 * @param {string} [id] - The id for this control group.
 * @param {object} [options] - An optional dictionary of options.
 * @param {boolean} [options.collapsible=true] - Whether this control group is collapsible.
 * @constructor
 * @augments Autodesk.Viewing.UI.Control
 * @memberof Autodesk.Viewing.UI
 * @category UI
 */

function ControlGroup (id, options) {
    avu.Control.call(this, id, options);

    var self = this;

    this._controls = [];

    this.addClass('adsk-control-group');

    this.handleChildSizeChanged = function(event) {
        var sizeEvent = {
            type: ControlGroup.Event.SIZE_CHANGED,
            childEvent: event
        };
        self.fireEvent(sizeEvent);
    };
};

/**
 * Enum for control group event IDs.
 * @readonly
 * @enum {String}
 */
ControlGroup.Event = {
    // Inherited from Control
    VISIBILITY_CHANGED: avu.Control.Event.VISIBILITY_CHANGED,
    COLLAPSED_CHANGED: avu.Control.Event.COLLAPSED_CHANGED,

    SIZE_CHANGED: 'ControlGroup.SizeChanged',
    CONTROL_ADDED: 'ControlGroup.ControlAdded',
    CONTROL_REMOVED: 'ControlGroup.ControlRemoved'
};

/**
 * Event fired a control is added to the control group.
 *
 * @event Autodesk.Viewing.UI.ControlGroup#CONTROL_ADDED
 * @type {object}
 * @property {string} control - The control that was added.
 * @property {number} index - The index at which the control was added.
 */

/**
 * Event fired when a control is removed from the control group.
 *
 * @event Autodesk.Viewing.UI.ControlGroup#CONTROL_REMOVED
 * @type {object}
 * @property {string} control - The control that was removed.
 * @property {number} index - The index at which the control was removed.
 */

/**
 * Event fired when the size of the control group changes.
 *
 * @event Autodesk.Viewing.UI.ControlGroup#SIZE_CHANGED
 * @type {object}
 * @property {object} childEvent - The event that the child fired.
 */

ControlGroup.prototype = Object.create(avu.Control.prototype);
ControlGroup.prototype.constructor = ControlGroup;

/**
 * Adds a control to this control group.
 *
 * @param {Autodesk.Viewing.UI.Control} control - The control to add.
 * @param {object} [options] - An option dictionary of options.
 * @param {object} [options.index] - The index to insert the control at.
 * @returns {boolean} True if the control was successfully added.
 * @fires Autodesk.Viewing.UI.ControlGroup#CONTROL_ADDED
 * @fires Autodesk.Viewing.UI.ControlGroup#SIZE_CHANGED
 */
ControlGroup.prototype.addControl = function(control, options) {

    var index = (options && options.index !== undefined) ? options.index : this._controls.length;

    if (this.getControl(control.getId()) !== null) {
        return false;
    }

    var addedEvent = {
        type: ControlGroup.Event.CONTROL_ADDED,
        control: control,
        index: index
    };

    if (index < this._controls.length) {
        this.container.insertBefore(control.container, this._controls[index].container);
        this._controls.splice(index, 0, control);
    } else {
        this.container.appendChild(control.container);
        this._controls.push(control);
    }

    // Listen for events on the child controls that may trigger a change in out size
    control.addEventListener(avu.Control.Event.VISIBILITY_CHANGED, this.handleChildSizeChanged);
    control.addEventListener(avu.Control.Event.COLLAPSED_CHANGED, this.handleChildSizeChanged);
    if (control instanceof ControlGroup) {
        control.addEventListener(ControlGroup.Event.SIZE_CHANGED, this.handleChildSizeChanged);
    }

    this.fireEvent(addedEvent);
    this.fireEvent(ControlGroup.Event.SIZE_CHANGED);

    return true;
};

/**
 * Returns the index of a control in this group. -1 if the item isn't found.
 * @param {string|Autodesk.Viewing.UI.Control} control - The control ID or control instance to find.
 * @returns {number} Index of a successfully removed control, otherwise -1.
 */
ControlGroup.prototype.indexOf = function(control) {
    for (var i = 0; i < this._controls.length; i++) {
        var c = this._controls[i];
        if (c === control || (typeof control === "string" && control === c.getId())) {
            return i;
        }
    }

    return -1;
};

/**
 * Removes a control from this control group.
 * @param {string|Autodesk.Viewing.UI.Control} control - The control ID or control instance to remove.
 * @returns {boolean} True if the control was successfully removed.
 * @fires Autodesk.Viewing.UI.ControlGroup#CONTROL_REMOVED
 * @fires Autodesk.Viewing.UI.ControlGroup#SIZE_CHANGED
 */
ControlGroup.prototype.removeControl = function(control) {

    var thecontrol = (typeof control === "string") ? this.getControl(control) : control;

    if (!thecontrol) {
        return false;
    }

    var index = this._controls.indexOf(thecontrol);
    if (index === -1) {
        return false;
    }

    this._controls.splice(index, 1);
    this.container.removeChild(thecontrol.container);

    var addedEvent = {
        type: ControlGroup.Event.CONTROL_REMOVED,
        control: thecontrol,
        index: index
    };

    // Remove listeners from children
    thecontrol.removeEventListener(avu.Control.Event.VISIBILITY_CHANGED, this.handleChildSizeChanged);
    thecontrol.removeEventListener(avu.Control.Event.COLLAPSED_CHANGED, this.handleChildSizeChanged);
    if (thecontrol instanceof ControlGroup) {
        thecontrol.removeEventListener(ControlGroup.Event.SIZE_CHANGED, this.handleChildSizeChanged);
    }

    this.fireEvent(addedEvent);
    this.fireEvent(ControlGroup.Event.SIZE_CHANGED);

    return true;
};

/**
 * Returns the control with the corresponding ID if it is in this control group.
 * @param {string} controlId - The ID of the control.
 * @returns {Autodesk.Viewing.UI.Control} The control or null if it doesn't exist.
 */
ControlGroup.prototype.getControl = function(controlId) {
    for (var i = 0; i < this._controls.length; i++) {
        if (controlId === this._controls[i].getId()) {
            return this._controls[i];
        }
    }

    return null;
};

/**
 * Returns the control ID with for corresponding index if it is in this control group.
 * @param {number} index - Index of the control.
 * @returns {string} The ID of the control or null if it doesn't exist.
 */
ControlGroup.prototype.getControlId = function(index) {

        if (index < 0 || index >= this._controls.length) {
            return null;
        }
        return this._controls[index].getId();
};


/**
 * Returns the number of controls in this control group.
 * @returns {number} The number of controls.
 */
ControlGroup.prototype.getNumberOfControls = function() {
    return this._controls.length;
};

/**
 * Sets the collapsed state of this control group. Iterates over the child controls and calls
 * child.setCollapsed(collapsed).
 * @param {boolean} collapsed - The collapsed value to set.
 * @returns {boolean} True if at least one collapsible child's state changes.
 * @fires Autodesk.Viewing.UI.Control#COLLAPSED_CHANGED
 */
ControlGroup.prototype.setCollapsed = function(collapsed) {
    if (!this._isCollapsible) {
        return false;
    }

    var childHasCollapsed = false;

    this._controls.forEach(function(control) {
        if (control.isCollapsible() && control.setCollapsed(collapsed)) {
            childHasCollapsed = true;
        }
    });

    if (childHasCollapsed) {
        if (collapsed) {
            this.container.classList.add('collapsed');
        } else {
            this.container.classList.remove('collapsed');
        }

        this.fireEvent({
            type: ControlGroup.Event.COLLAPSED_CHANGED,
            isCollapsed: collapsed
        });
    }

    return childHasCollapsed;
};

Autodesk.Viewing.UI.ControlGroup = ControlGroup;
})();

;
(function() {

"use strict";

var avu = Autodesk.Viewing.UI;

/**
 * Core class representing a toolbar UI.
 *
 * It consists of {@link Autodesk.Viewing.UI.ControlGroup} that group controls by functionality.
 * @alias Autodesk.Viewing.UI.ToolBar
 * @param {string} id - The id for this toolbar.
 * @param {object} [options] - An optional dictionary of options.
 * @param {boolean} [options.collapsible=true] - Whether this toolbar is collapsible.
 * @constructor
 * @augments Autodesk.Viewing.UI.ControlGroup
 * @memberof Autodesk.Viewing.UI
 * @category UI
 */
function ToolBar(id, options) {
    avu.ControlGroup.call(this, id, options);

    this.removeClass('adsk-control-group');
    this.addClass('adsk-toolbar');
};

/**
 * Enum for toolbar event IDs.
 * @readonly
 * @enum {String}
 */
ToolBar.Event = {
    // Inherited from Control
    VISIBILITY_CHANGED: avu.Control.Event.VISIBILITY_CHANGED,
    COLLAPSED_CHANGED: avu.Control.Event.COLLAPSED_CHANGED,

    // Inherited from ControlGroup
    CONTROL_ADDED: avu.ControlGroup.Event.CONTROL_ADDED,
    CONTROL_REMOVED: avu.ControlGroup.Event.CONTROL_REMOVED,
    SIZE_CHANGED: avu.ControlGroup.Event.SIZE_CHANGED
};

ToolBar.prototype = Object.create(avu.ControlGroup.prototype);
ToolBar.prototype.constructor = ToolBar;

Autodesk.Viewing.UI.ToolBar = ToolBar;
})();
;AutodeskNamespace('Autodesk.Viewing.UI');

(function() {

var avu = Autodesk.Viewing.UI;


/**
 * @class
 * A button control that can be added to toolbars.
 *
 * @param {String?} id - The id for this button. Optional.
 * @param {Object} [options] - An optional dictionary of options.
 * @param {Boolean} [options.collapsible=true] - Whether this button is collapsible.
 *
 * @constructor
 * @augments Autodesk.Viewing.UI.Control
 */
avu.Button = function(id, options) {
    avu.Control.call(this, id, options);
    var self = this;
    var app;
    if(options) {
        app = options.app;
    } else { // for nanodesign with globals
        app = {};
        app.ViewManager = ViewManager;
        app.MoleculeViewer = ViewManager.viewer;
    }

    this._state = avu.Button.State.INACTIVE;

    this.icon = document.createElement("div");
    this.icon.classList.add("adsk-button-icon");
    this.container.appendChild(this.icon);
    app.MoleculeViewer.addEventListener(Autodesk.Viewing.MENU_SELECTION_UPDATED,function(event) {this.setDropdown(event);}.bind(this),false);
    this.container.addEventListener('click', function(event) {
        self.fireEvent(avu.Button.Event.CLICK);
        if (self.onClick)
            self.onClick(event);
        event.stopPropagation();
    });

    // Add rollover only if this is not a touch device.
    if ( !isTouchDevice() ) {
        this.container.addEventListener("mouseover", function(e) {
            self.onMouseOver(e);
        });

        this.container.addEventListener("mouseout", function(e) {
            self.onMouseOut(e);
        });
    } else {
        this.container.addEventListener("touchstart", touchStartToClick);
    }

    this.addClass('adsk-button');
    this.addClass(avu.Button.StateToClassMap[this._state]);
};

/**
 * Enum for button event IDs.
 * @readonly
 * @enum {String}
 */
avu.Button.Event = {
    // Inherited from Control
    VISIBILITY_CHANGED: avu.Control.Event.VISIBILITY_CHANGED,
    COLLAPSED_CHANGED: avu.Control.Event.COLLAPSED_CHANGED,

    STATE_CHANGED: 'Button.StateChanged',
    CLICK: 'click'
};

/**
 * Enum for button states
 * @readonly
 * @enum {Number}
 */
avu.Button.State = {
    ACTIVE: 0,
    INACTIVE: 1,
    DISABLED: 2
};

/**
 * @private
 */
avu.Button.StateToClassMap = (function() {
    var state = avu.Button.State;
    var map = {};

    map[state.ACTIVE] = 'active';
    map[state.INACTIVE] = 'inactive';
    map[state.DISABLED] = 'disabled';

    return map;
}());


/**
 * Event fired when state of the button changes.
 *
 * @event Autodesk.Viewing.UI.Button#STATE_CHANGED
 * @type {Object}
 * @property {String} buttonId - The ID of the button that fired this event.
 * @property {Autodesk.Viewing.UI.Button.State} state - The new state of the button.
 */

avu.Button.prototype = Object.create(avu.Control.prototype);
avu.Button.prototype.constructor = avu.Button;

/**
 * Sets the state of this button.
 *
 * @param {Autodesk.Viewing.UI.Button.State} state - The state.
 *
 * @returns {Boolean} - True if the state was set successfully.
 *
 * @fires Autodesk.Viewing.UI.Button#STATE_CHANGED
 */
avu.Button.prototype.setState = function(state) {
    if (state === this._state) {
        return false;
    }
    if(this.hasLabel()) {
        this.label.classList.remove(avu.Button.StateToClassMap[this._state]);
        this.label.classList.add(avu.Button.StateToClassMap[state]);
    }

    if(this.hasDropdown()) {
        this.dropDown.classList.remove(avu.Button.StateToClassMap[this._state]);
        this.dropDown.classList.add(avu.Button.StateToClassMap[state]);
    }

    this.removeClass(avu.Button.StateToClassMap[this._state]);
    this.addClass(avu.Button.StateToClassMap[state]);
    this._state = state;

    var event = {
        type: avu.Button.Event.STATE_CHANGED,
        state: state
    };

    this.fireEvent(event);

    return true;
};

/**
 * Sets the icon for the button.
 *
 * @param {string} iconClass The CSS class defining the appearance of the button icon (e.g. image background).
 */
avu.Button.prototype.setIcon = function(iconClass) {
    if (this.iconClass)
        this.icon.classList.remove(this.iconClass);
    this.iconClass = iconClass;
    this.icon.classList.add(iconClass);
};

/**
 * Creates a label div to the left of the icon
 * @param {string} labelText The text to be displayed in the label div
 */
avu.Button.prototype.addLabel = function addLabel(labelText) {
    this.label = document.createElement('div');
    this.label.setAttribute('class','adsk-button-label');
    this.label.innerHTML = labelText;
    this.container.appendChild(this.label);
};


/**
 * Creates a dropdown div to the left of the icon
 */
avu.Button.prototype.addDropdown = function addDropdown() {
    this.dropDown = document.createElement('div');
    this.dropDown.setAttribute('class','adsk-button-dropdown');
    this.container.appendChild(this.dropDown);
};

/**
 * Populates a dropdown div with data from a data object
 * @param {object} data Contains menu data including click actions
 */
avu.Button.prototype.populateDropdown = function populateDropDown(data) {
    var isSafari = navigator.userAgent.toLowerCase().match(/safari/) && !navigator.userAgent.toLowerCase().match(/chrome/) ? true : false;
    var item,
        menuItem,
        menuItems,
        menuItemIcon,
        menuItemText,
        menuItemHotkey;

    this.dropDown.length = 0;
    if(!data) {
        return;
    }

    for (item in data.items) {
        if (data.items.hasOwnProperty(item)) {
            //for customized menu like pdb loader
            if(data.items[item].custom) {
                menuItem = document.createElement('div');
                menuItem.setAttribute('class', 'mol-menu-item');
                menuItem.setAttribute('id',data.items[item].id);
                data.items[item].customCode(menuItem);
                menuItems.appendChild(menuItem);
            } else {
                menuItem = document.createElement('div');
                menuItem.checkStatus = data.items[item].check;
                menuItem.setAttribute('class', 'mol-menu-item');
                menuItem.setAttribute('id',data.items[item].id);
                //menuItemIcon = document.createElement('div');
                //menuItemIcon.setAttribute('class', 'mol-menu-item-icon');
                //menuItemIcon.style.background = 'url("' + data.items[item].icon + '") no-repeat top left';
                //menuItemIcon.style.opacity = '0';
                menuItemHotkey = document.createElement('div');
                menuItemHotkey.setAttribute('class','mol-menu-item-hotkey');
                if(data.items[item].hotkey) {
                    menuItemHotkey.innerHTML = data.items[item].hotkey;
                }


                menuItemText = document.createElement('div');
                menuItemText.setAttribute('class', 'mol-menu-text');
                menuItemText.innerHTML = data.items[item].text;

                //menuItem.appendChild(menuItemIcon);
                menuItem.appendChild(menuItemText);
                menuItem.appendChild(menuItemHotkey);
                if (isSafari && data.items[item].noSafari) {
                    menuItem.classList.add('disabled');
                } else {
                    menuItem.addEventListener('click', data.items[item].action, this);
                }
                this.dropDown.appendChild(menuItem);
                this.dropDown.length += 1;
            }
        }
    }
};

avu.Button.prototype.setDropdown = function setDropdown() {

    if(!this.dropDown) {
        return;
    }

    var i,
        j,
        items;
    for (i = 0; i < this.dropDown.length; i++) {
        items = this.dropDown.querySelectorAll('.mol-menu-item');
        for (j = 0; j < items.length; j++) {
            if (items[j].checkStatus) {
                if (!items[j].checkStatus()) {

                    items[j].classList.remove('selected');
                } else {
                    items[j].classList.add('selected');
                    this.label.innerHTML = items[j].querySelector('.mol-menu-text').innerHTML + ' ';
                }
            }
        }
    }


};

/**
 * Checks to see if the button has a label or not
 */
avu.Button.prototype.hasLabel = function hasLabel() {
    return(this.container.querySelector('.adsk-button-label') ? true : false);
};

/**
 * Checks to see if the button has a dropdown or not
 */
avu.Button.prototype.hasDropdown = function hasDropdown() {
    return(this.container.querySelector('.adsk-button-dropdown') ? true : false);
};

/**
 * Returns the state of this button.
 *
 * @returns {Autodesk.Viewing.UI.Button.State} - The state of the button.
 */
avu.Button.prototype.getState = function() {
    return this._state;
};

/**
 * Override this method to be notified when the user clicks on the button.
 * @param {MouseEvent} event
 */
avu.Button.prototype.onClick = function(event) {

};

/**
 * Override this method to be notified when the mouse enters the buton.
 * @param {MouseEvent} event
 */
avu.Button.prototype.onMouseOver = function(event) {

};

/**
 * Override this method to be notified when the mouse leaves the button.
 * @param {MouseEvent} event
 */
avu.Button.prototype.onMouseOut = function(event) {

};


})();;
(function() {

    "use strict";

    var avu = Autodesk.Viewing.UI;
    var avp = Autodesk.Viewing.Private;

    /**
     * ComboButton with submenu that can be added to toolbars.
     *
     * @param {string} [id] - The id for this comboButton. Optional.
     * @param {object} [options] - An optional dictionary of options.
     * @constructor
     * @augments Autodesk.Viewing.UI.Button
	 * @memberof Autodesk.Viewing.UI
     * @category UI
     */
    function ComboButton(id, options) {
        avu.Button.call(this, id, options);

        this.arrowButton = new avu.Button(id + 'arrow');
        this.arrowButton.addClass('adsk-button-arrow');
        this.arrowButton.removeClass('adsk-button');

        this.subMenu = new avu.RadioButtonGroup(id + 'SubMenu');
        this.subMenu.addClass('toolbar-vertical-group');
        this.subMenu.setVisible(false);

        this.container.insertBefore(this.subMenu.container, this.container.firstChild);
        this.container.insertBefore(this.arrowButton.container, this.container.firstChild);

        var scope = this;
        this.arrowButton.onClick = function(e) {
            scope.subMenu.setVisible(!scope.subMenu.isVisible());
        };

        this.toggleFlyoutVisible = function() {
            scope.subMenu.setVisible(!scope.subMenu.isVisible());
        };

        this.onClick = function(e) {
            scope.subMenu.setVisible(!scope.subMenu.isVisible());
        };

        this.subMenuActiveButtonChangedHandler = function(event) {
            if (event.isActiveButton) {
                scope.setIcon(event.target.getActiveButton().iconClass);
                scope.setToolTip(event.target.getActiveButton().getToolTip());
                scope.setState(avu.Button.State.ACTIVE);
                scope.onClick = event.button.onClick;
            }
            else {
                scope.setState(avu.Button.State.INACTIVE);
            }
        };

        this.subMenu.addEventListener(avu.RadioButtonGroup.Event.ACTIVE_BUTTON_CHANGED, this.subMenuActiveButtonChangedHandler);

        // put up an invisible div to catch click-off close submenu
        var clickOff = avp.stringToDOM('<div class="clickoff" style="position:fixed; top:0; left:0; width:100vw; height:100vh;"></div>');
        this.subMenu.container.insertBefore(clickOff, this.subMenu.container.firstChild);
        clickOff.addEventListener("click", function(e) {
            scope.subMenu.setVisible(false);
            e.stopPropagation();
        });

    };

    ComboButton.prototype = Object.create(avu.Button.prototype);
    ComboButton.prototype.constructor = ComboButton;


    /**
     * Adds a new control to the combo fly-out.
     */
    ComboButton.prototype.addControl = function(button) {
    /*
        if (this.subMenu.getNumberOfControls() === 0)
            this.onClick = button.onClick;
    */
        this.subMenu.addControl(button);
        button.addEventListener(avu.Button.Event.CLICK, this.toggleFlyoutVisible);

    };


    ComboButton.prototype.removeControl = function(button) {

        button.removeEventListener(avu.Button.Event.CLICK, this.toggleFlyoutVisible);

    };

    ComboButton.prototype.setState = function(state) {

        //Overloaded to inactivate children when the parent is inactivated
        if (state === avu.Button.State.INACTIVE) {
            var ab = this.subMenu.getActiveButton();
            if (ab) {
                ab.setState(avu.Button.State.INACTIVE);
            }
        }

        //Also call super
        avu.Button.prototype.setState.call(this, state);
    };

    /**
     * Copies tooltip (if any), icon and click handler into an internal attribute.
     * Can be restored through restoreDefault().
     */
    ComboButton.prototype.saveAsDefault = function() {
        this.defaultState = {};
        // Save tooltip
        if (this._toolTipElement && this._toolTipElement.getAttribute("tooltipText")) {
            this.defaultState.tooltip = this._toolTipElement.getAttribute("tooltipText");
        }
        // Save icon
        this.defaultState.icon = this.iconClass;
        // Save click handler
        this.defaultState.onClick = this.onClick;
    };

    /**
     * Restores visual settings previously stored through saveAsDefault().
     */
    ComboButton.prototype.restoreDefault = function() {
        if (!this.defaultState) return;
        if (this.defaultState.tooltip) {
            this.setToolTip(this.defaultState.tooltip);
        }
        if (this.defaultState.icon) {
            this.setIcon(this.defaultState.icon);
        }
        this.onClick = this.defaultState.onClick; // No check on this one.
        this.setState(avu.Button.State.INACTIVE);
    };

Autodesk.Viewing.UI.ComboButton = ComboButton;

})();
;AutodeskNamespace('Autodesk.Viewing.UI');

(function() {

var avu = Autodesk.Viewing.UI;


/**
 * @class
 * A button control that can be added to toolbars.
 *
 * @param {String?} id - The id for this button. Optional.
 * @param {Object} [options] - An optional dictionary of options.
 * @param {Boolean} [options.collapsible=true] - Whether this button is collapsible.
 *
 * @constructor
 * @augments Autodesk.Viewing.UI.Control
 */
avu.InspectorButton = function(id, options) {
    avu.Button.call(this, id, options);

    if(options) {
        this.app = options.app;
    } else {
        this.app = {};
        this.app.ViewManager = ViewManager;
        this.app.MoleculeViewer = ViewManager.viewer;
    }

    var self = this;

    this._state = avu.Button.State.INACTIVE;

    this.icon = document.createElement("div");
    this.icon.classList.add("adsk-button-icon");
    this.container.appendChild(this.icon);
    // Add rollover only if this is not a touch device.
    if ( !isTouchDevice() ) {
        this.container.addEventListener("mouseover", function(e) {
            self.onMouseOver(e);
        });

        this.container.addEventListener("mouseout", function(e) {
            self.onMouseOut(e);
        });
    } else {
        this.container.addEventListener("touchstart", touchStartToClick);
    }

    this.removeClass('adsk-button');
    this.addClass('inspector-button');
    this.addClass(avu.Button.StateToClassMap[this._state]);
};

avu.InspectorButton.prototype = Object.create(avu.Button.prototype);
avu.InspectorButton.prototype.constructor = avu.InspectorButton;

})();

;
(function() {

    "use strict";

    var avu = Autodesk.Viewing.UI;
    var avp = Autodesk.Viewing.Private;

    /**
     * A comboButton with subMenu can be added to toolbars.
     *
     * @param {String} id - The id for this comboButton. Optional.
     * @param {Object} [options] - An optional dictionary of options.
     *
     * @constructor
     * @augments Autodesk.Viewing.UI.Button
	 * @memberof Autodesk.Viewing.UI
     */
    function InspectorComboButton(id, options) {
        var divider = document.createElement('div');
        divider.setAttribute('class','inspector-split-divider');
        avu.Button.call(this, id, options);
        if(options) {
            this.app = options.app;
        } else {
            this.app = {};
            this.app.ViewManager = ViewManager;
            this.app.MoleculeViewer = ViewManager.viewer;
        }

        this.arrowButton = new avu.Button(id + 'arrow', {app: this.app});
        this.arrowButton.addClass('list-button-arrow');
        this.arrowButton.removeClass('adsk-button');
        this.arrowButton.container.appendChild(divider);


        this.subMenu = new avu.RadioButtonGroup(id + 'SubMenu');
        this.subMenu.addClass('inspector-submenu');
        this.subMenu.setVisible(false);

        this.container.insertBefore(this.subMenu.container, this.container.firstChild);
        this.container.insertBefore(this.arrowButton.container, this.container.firstChild);

        var scope = this;
        this.arrowButton.onClick = function(e) {
            scope.subMenu.setVisible(!scope.subMenu.isVisible());
        };

        this.toggleFlyoutVisible = function() {
            scope.subMenu.setVisible(!scope.subMenu.isVisible());
        };

        this.onClick = function(e) {
            scope.subMenu.setVisible(!scope.subMenu.isVisible());
        };

        this.subMenuActiveButtonChangedHandler = function(event) {
            if (event.isActiveButton) {
                scope.setIcon(event.target.getActiveButton().iconClass);
                scope.setToolTip(event.target.getActiveButton().getToolTip());
                scope.setState(avu.Button.State.ACTIVE);
                scope.onClick = event.button.onClick;
            }
            else {
                scope.setState(avu.Button.State.INACTIVE);
            }
        };

        this.subMenu.addEventListener(avu.RadioButtonGroup.Event.ACTIVE_BUTTON_CHANGED, this.subMenuActiveButtonChangedHandler);

        // put up an invisible div to catch click-off close submenu
        var clickOff = avp.stringToDOM('<div class="clickoff" style="position:fixed; top:0; left:0; width:100vw; height:100vh;"></div>');
        //this.subMenu.container.insertBefore(clickOff, this.subMenu.container.firstChild);
        this.subMenu.container.appendChild(clickOff);
        clickOff.addEventListener("click", function(e) {
            scope.subMenu.setVisible(false);
            e.stopPropagation();
        });

        this.removeClass('adsk-button');
        this.addClass('inspector-button');

    };

    InspectorComboButton.prototype = Object.create(avu.Button.prototype);
    InspectorComboButton.prototype.constructor = InspectorComboButton;


    /**
     * * Adds a new control to the combo fly-out
     */
    InspectorComboButton.prototype.addControl = function(button) {
    /*
        if (this.subMenu.getNumberOfControls() === 0)
            this.onClick = button.onClick;
    */
        this.subMenu.addControl(button);
        button.addEventListener(avu.Button.Event.CLICK, this.toggleFlyoutVisible);

    };


    InspectorComboButton.prototype.removeControl = function(button) {

        button.removeEventListener(avu.Button.Event.CLICK, this.toggleFlyoutVisible);

    };

    InspectorComboButton.prototype.setState = function(state) {

        //Overloaded to inactivate children when the parent is inactivated
        if (state === avu.Button.State.INACTIVE) {
            var ab = this.subMenu.getActiveButton();
            if (ab) {
                ab.setState(avu.Button.State.INACTIVE);
            }
        }

        //Also call super
        avu.Button.prototype.setState.call(this, state);
    };

    /**
     * Copies tooltip (if any), icon and click handler into an internal attribute.
     * Can be restored through restoreDefault().
     */
    InspectorComboButton.prototype.saveAsDefault = function() {
        this.defaultState = {};
        // Save tooltip
        if (this._toolTipElement && this._toolTipElement.getAttribute("tooltipText")) {
            this.defaultState.tooltip = this._toolTipElement.getAttribute("tooltipText");
        }
        // Save icon
        this.defaultState.icon = this.iconClass;
        // Save click handler
        this.defaultState.onClick = this.onClick;
    };

    /**
     * Restores visual settings previously stored through saveAsDefault().
     */
    InspectorComboButton.prototype.restoreDefault = function() {
        if (!this.defaultState) return;
        if (this.defaultState.tooltip) {
            this.setToolTip(this.defaultState.tooltip);
        }
        if (this.defaultState.icon) {
            this.setIcon(this.defaultState.icon);
        }
        this.onClick = this.defaultState.onClick; // No check on this one.
        this.setState(avu.Button.State.INACTIVE);
    };

Autodesk.Viewing.UI.InspectorComboButton = InspectorComboButton;

})();
;AutodeskNamespace('Autodesk.Viewing.UI');

(function() {

var avu = Autodesk.Viewing.UI;


/**
 * @class
 * A button control that can be added to toolbars.
 *
 * @param {String?} id - The id for this button. Optional.
 * @param {Object} [options] - An optional dictionary of options.
 * @param {Boolean} [options.collapsible=true] - Whether this button is collapsible.
 *
 * @constructor
 * @augments Autodesk.Viewing.UI.Control
 */
avu.ListButton = function(id, options) {
    avu.Button.call(this, id, options);

    var self = this;

    this._state = avu.Button.State.INACTIVE;

    //this.icon = document.createElement("div");
    //this.icon.classList.add("list-button-icon");
    //this.container.appendChild(this.icon);
    // Add rollover only if this is not a touch device.
    if ( !isTouchDevice() ) {
        this.container.addEventListener("mouseover", function(e) {
            self.onMouseOver(e);
        });

        this.container.addEventListener("mouseout", function(e) {
            self.onMouseOut(e);
        });
    } else {
        this.container.addEventListener("touchstart", touchStartToClick);
    }

    this.removeClass('adsk-button');
    this.addClass('drop-down');
    this.addClass('inspector-drop-down-item');
    this.icon.classList.remove("adsk-button-icon");
    this.icon.classList.add("list-button-icon");
    this.addClass(avu.Button.StateToClassMap[this._state]);
};

avu.ListButton.prototype = Object.create(avu.Button.prototype);
avu.ListButton.prototype.constructor = avu.ListButton;

})();

;
(function() {

"use strict";

var avu = Autodesk.Viewing.UI;

/**
 * Group of controls that act like a radio group.
 *
 * I.e., only one button may be active at a time. Only accepts {@link Autodesk.Viewing.UI.Button}.
 * @param {string} id - The id for this control group.
 * @param {object} [options] - An optional dictionary of options.
 * @param {boolean} [options.collapsible=true] - Whether this control group is collapsible.
 * @constructor
 * @augments Autodesk.Viewing.UI.ControlGroup
 * @memberof Autodesk.Viewing.UI
 * @category UI
 */
function RadioButtonGroup(id, options) {
    avu.ControlGroup.call(this, id, options);

    var self = this;

    this._activeButton = null;

    this._handleButtonStateChange = function(event) {
        var states = avu.Button.State;

        if (event.state !== states.ACTIVE) {
            if (event.target === self._activeButton) {
                self._activeButton = null;
                self.fireEvent({
                    type: RadioButtonGroup.Event.ACTIVE_BUTTON_CHANGED,
                    button: event.target,
                    isActiveButton: false
                });
            }
            return;
        } else {
            self._activeButton = event.target;
            self.fireEvent({
                type: RadioButtonGroup.Event.ACTIVE_BUTTON_CHANGED,
                button: event.target,
                isActiveButton: true
            });
        }

        self._controls.forEach(function(control) {
            if (control !== event.target && control.getState() !== states.DISABLED) {
                control.setState(states.INACTIVE);
            }
        });
    }
};

/**
 * Enum for radio button group event IDs.
 * @readonly
 * @enum {String}
 */
RadioButtonGroup.Event = {
    ACTIVE_BUTTON_CHANGED: 'RadioButtonGroup.ActiveButtonChanged',

    // Inherited from Control
    VISIBILITY_CHANGED: avu.Control.Event.VISIBILITY_CHANGED,
    COLLAPSED_CHANGED: avu.Control.Event.COLLAPSED_CHANGED,

    // Inherited from ControlGroup
    CONTROL_ADDED: avu.ControlGroup.Event.CONTROL_ADDED,
    CONTROL_REMOVED: avu.ControlGroup.Event.CONTROL_REMOVED,
    SIZE_CHANGED: avu.ControlGroup.Event.SIZE_CHANGED
};

/**
 * Event fired when active button for this radio group changes.
 *
 * @event Autodesk.Viewing.UI.RadioButtonGroup#ACTIVE_BUTTON_CHANGED
 * @type {object}
 * @property {Autodesk.Viewing.UI.Button} button - The button whose state is changing.
 * @property {boolean} isActiveButton - Is the event target the currently active button.
 */

RadioButtonGroup.prototype = Object.create(avu.ControlGroup.prototype);
RadioButtonGroup.prototype.constructor = RadioButtonGroup;

/**
 * Adds a control to this radio button group. The control must be a {@link Autodesk.Viewing.UI.Button|button}.
 *
 * @param {Autodesk.Viewing.UI.Button} control - The button to add.
 * @param {object} [options] - An option dictionary of options.
 * @param {object} [options.index] - The index to insert the control at.
 * @returns {boolean} True if the button was successfully added.
 * @fires Autodesk.Viewing.UI.ControlGroup#CONTROL_ADDED
 * @fires Autodesk.Viewing.UI.ControlGroup#SIZE_CHANGED
 */
RadioButtonGroup.prototype.addControl = function(control, options) {
    if (!(control instanceof avu.Button)) {
        return false;
    }

    // Add listeners for radio functionality if we were successful
    if (avu.ControlGroup.prototype.addControl.call(this, control, options)) {
        control.addEventListener(avu.Button.Event.STATE_CHANGED, this._handleButtonStateChange);
        return true;
    }

    return false;
};

/**
 * Removes a control from this control group.
 *
 * @param {string|Autodesk.Viewing.UI.Control} control - The control ID or control instance to remove.
 * @returns {boolean} True if the control was successfully removed.
 * @fires Autodesk.Viewing.UI.ControlGroup#CONTROL_REMOVED
 * @fires Autodesk.Viewing.UI.ControlGroup#SIZE_CHANGED
 */
RadioButtonGroup.prototype.removeControl = function(control) {

    var thecontrol = (typeof control == "string") ? this.getControl(control) : control;

    // Remove listeners for radio functionality if we were successful
    if (thecontrol !== null && avu.ControlGroup.prototype.removeControl.call(this, thecontrol)) {
        thecontrol.removeEventListener(avu.Button.Event.STATE_CHANGED, this._handleButtonStateChange);
        return true;
    }

    return false;
};

/**
 * Returns the active button in this radio button group.
 *
 * @returns {Autodesk.Viewing.UI.Button} The active button. Null if no button is active.
 */
RadioButtonGroup.prototype.getActiveButton = function() {
    return this._activeButton;
};

Autodesk.Viewing.UI.RadioButtonGroup = RadioButtonGroup;
})();
;AutodeskNamespace('Autodesk.Viewing.UI');

(function() {

    var avu = Autodesk.Viewing.UI;


    /**
     * @class
     * A button control that can be added to toolbars.
     *
     * @param {String?} id - The id for this button. Optional.
     * @param {Object} [options] - An optional dictionary of options.
     * @param {String} [options.class]
     * @param {String} [options.icon0=className]
     * @param {String} [options.icon1=className]
     * @param {Number} [options.min=minVal]
     * @param {Number} [options.max=maxVal]
     * @param {Number} [options.step=stepVal]
     * @param {Number} [options.value0=val0]
     * @param {Number} [options.value1=val1]
     * @param {Array} [options.gradient = [color1, color2]]
     * @param {Object} [options.range = {'min': 0, '10%': 100, '20%': 200,...,'max':100}
     *
     * @constructor
     * @augments Autodesk.Viewing.UI.Control
     */
    avu.Range = function(id, options) {
        avu.Control.call(this, id, options);

        var self = this;

        this._state = avu.Range.State.INACTIVE;
        if(options.icon0) {
            this.icon0 = document.createElement("div");
            this.icon0.classList.add('slider-icon');
            this.icon0.classList.add(options.icon0);
            this.container.appendChild(this.icon0);
        }

        this.sliderElement = document.createElement('div');
        this.startLower = isNaN(options.value0) ? 33 : options.value0;
        this.startUpper = isNaN(options.value1) ? 66 : options.value1;
        if(options.range) {
            this.range = options.range;
        } else {
            this.range = {
                "min": options.min ? options.min : 0.0,
                    "max": options.max ? options.max : 100.0
                };
        }

        this.rangeSlider = noUiSlider.create(this.sliderElement, {
            start: [(options.value0 ? options.value0 : this.startLower),(options.value1 ? options.value1 : this.startUpper)],
            margin: 5,
            connect: false,
            range: this.range
        });

        var origins = this.sliderElement.querySelectorAll('.noUi-origin');
        var sliderBase = this.sliderElement.querySelector('.noUi-base');
        var gradient = 'background: linear-gradient(to right';

        // set optional gradient background
        if (options.gradient) {
            for (var i = 0; i < options.gradient.length; i++) {
                gradient += ',' + options.gradient[i];
            }
            gradient +=')';
            sliderBase.setAttribute('style', gradient);
        } else {
            sliderBase.setAttribute('style','background: #999999');
        }

        //custom div to cover base to the left of lower slider handle
        this.cover = document.createElement('div');
        this.cover.setAttribute('class','range-left-cover');

        sliderBase.insertBefore(this.cover,origins[0]);
        this.cover.setAttribute('style','width:' + self.startLower + '%');
        origins[1].classList.add('range-upper-origin');

        this.rangeSlider.on('update', function( values, handle ) {
            if ( handle === 0 ) {
                if(self.sliderElement.querySelectorAll('.noUi-origin')[0]) {
                    self.cover.setAttribute('style','width:'+values[0]+'%');
                }
            }
        });

        this.container.appendChild(this.sliderElement);
        if(options.icon1) {
            this.icon1 = document.createElement("div");
            this.icon1.classList.add('slider-icon');
            this.icon1.classList.add(options.icon1);
            this.container.appendChild(this.icon1);
        }


        this.sliderElement.addEventListener('input', function(event) {
            self.fireEvent(avu.Range.Event.INPUT);
            if (self.onInput)
                self.onInput(event);
            event.stopPropagation();
        });

        this.sliderElement.addEventListener('change', function(event) {
            self.fireEvent(avu.Range.Event.CHANGE);
            if (self.onChange)
                self.onChange(event);
            event.stopPropagation();
        });

        // Add rollover only if this is not a touch device.
        if ( !isTouchDevice() ) {
            this.container.addEventListener("mouseover", function(e) {
                self.onMouseOver(e);
            });

            this.container.addEventListener("mouseout", function(e) {
                self.onMouseOut(e);
            });
        }

        this.addClass('adsk-slider');
        this.addClass(avu.Range.StateToClassMap[this._state]);
    };

    /**
     * Enum for button event IDs.
     * @readonly
     * @enum {String}
     */
    avu.Range.Event = {
        // Inherited from Control
        VISIBILITY_CHANGED: avu.Control.Event.VISIBILITY_CHANGED,
        COLLAPSED_CHANGED: avu.Control.Event.COLLAPSED_CHANGED,

        STATE_CHANGED: 'Range.StateChanged',
        INPUT: 'input',
        CHANGE: 'change'
    };

    /**
     * Enum for slider states
     * @readonly
     * @enum {Number}
     */
    avu.Range.State = {
        ACTIVE: 0,
        INACTIVE: 1,
        DISABLED: 2
    };

    /**
     * @private
     */
    avu.Range.StateToClassMap = (function() {
        var state = avu.Range.State;
        var map = {};

        map[state.ACTIVE] = 'active';
        map[state.INACTIVE] = 'inactive';
        map[state.DISABLED] = 'disabled';

        return map;
    }());


    /**
     * Event fired when state of the button changes.
     *
     * @event Autodesk.Viewing.UI.Range#STATE_CHANGED
     * @type {Object}
     * @property {String} buttonId - The ID of the button that fired this event.
     * @property {Autodesk.Viewing.UI.Range.State} state - The new state of the button.
     */

    avu.Range.prototype = Object.create(avu.Control.prototype);
    avu.Range.prototype.constructor = avu.Range;

    /**
     * Sets the state of this slider.
     *
     * @param {Autodesk.Viewing.UI.Range.State} state - The state.
     *
     * @returns {Boolean} - True if the state was set successfully.
     *
     * @fires Autodesk.Viewing.UI.Range#STATE_CHANGED
     */
    avu.Range.prototype.setState = function(state) {
        if (state === this._state) {
            return false;
        }
        if(this.hasLabel()) {
            this.label.classList.remove(avu.Range.StateToClassMap[this._state]);
            this.label.classList.add(avu.Range.StateToClassMap[state]);
        }

        this.removeClass(avu.Range.StateToClassMap[this._state]);
        this.addClass(avu.Range.StateToClassMap[state]);
        this._state = state;

        var event = {
            type: avu.Range.Event.STATE_CHANGED,
            state: state
        };

        this.fireEvent(event);

        return true;
    };

    /**
     * Sets the icon for the button.
     *
     * @param {string} iconClass The CSS class defining the appearance of the button icon (e.g. image background).
     */
    avu.Range.prototype.setIcon = function(iconClass) {
        if (this.iconClass)
            this.icon.classList.remove(this.iconClass);
        this.iconClass = iconClass;
        this.icon.classList.add(iconClass);
    };

    /**
     * Creates a label div to the left of the icon
     * @param {string} labelText The text to be displayed in the label div
     */
    avu.Range.prototype.addLabel = function addLabel(labelText) {
        this.label = document.createElement('div');
        this.label.setAttribute('class','adsk-slider-label');
        this.label.innerHTML = labelText;
        this.container.appendChild(this.label);
    };



    /**
     * Checks to see if the button has a label or not
     */
    avu.Range.prototype.hasLabel = function hasLabel() {
        return(this.container.querySelector('.adsk-slider-label') ? true : false);
    };

    /**
     * Returns the state of this button.
     *
     * @returns {Autodesk.Viewing.UI.Range.State} - The state of the button.
     */
    avu.Range.prototype.getState = function() {
        return this._state;
    };

    /**
     * Override this method to be notified when the user clicks on the button.
     * @param {MouseEvent} event
     */
    avu.Range.prototype.onClick = function(event) {

    };

    /**
     * Override this method to be notified when the mouse enters the buton.
     * @param {MouseEvent} event
     */
    avu.Range.prototype.onMouseOver = function(event) {

    };

    /**
     * Override this method to be notified when the mouse leaves the button.
     * @param {MouseEvent} event
     */
    avu.Range.prototype.onMouseOut = function(event) {

    };

    avu.Range.prototype.setGradient = function(gradientArray) {
        var sliderBase = this.sliderElement.querySelector('.noUi-base');
        var gradient = 'background: linear-gradient(to right';

        for (var i = 0; i < gradientArray.length; i++) {
            gradient += ',' + gradientArray[i];
        }
        gradient +=')';
        sliderBase.setAttribute('style', gradient);
    };


})();
;AutodeskNamespace('Autodesk.Viewing.UI');

(function() {

var avu = Autodesk.Viewing.UI;


/**
 * @class
 * A button control that can be added to toolbars.
 *
 * @param {String?} id - The id for this button. Optional.
 * @param {Object} [options] - An optional dictionary of options.
 * @param {Boolean} [options.collapsible=true] - Whether this button is collapsible.
 *
 * @constructor
 * @augments Autodesk.Viewing.UI.Control
 */
avu.RoundButton = function(id, options) {
    avu.Button.call(this, id, options);

    var self = this;

    this._state = avu.Button.State.INACTIVE;
    this.icon.classList.remove('adsk-button-icon');
    this.icon.classList.add('round-button-icon');
    // Add rollover only if this is not a touch device.
    if ( !isTouchDevice() ) {
        this.container.addEventListener("mouseover", function(e) {
            self.onMouseOver(e);
        });

        this.container.addEventListener("mouseout", function(e) {
            self.onMouseOut(e);
        });
    } else {
        this.container.addEventListener("touchstart", touchStartToClick);
    }

    this.removeClass('adsk-button');
    this.addClass('round-button');
    this.addClass(avu.Button.StateToClassMap[this._state]);
};

avu.RoundButton.prototype = Object.create(avu.Button.prototype);
avu.InspectorButton.prototype.constructor = avu.InspectorButton;

})();

;AutodeskNamespace('Autodesk.Viewing.UI');

(function() {

var avu = Autodesk.Viewing.UI;


/**
 * @class
 * A button control that can be added to toolbars.
 *
 * @param {String?} id - The id for this button. Optional.
 * @param {Object} [options] - An optional dictionary of options.
 * @param {String} [options.class]
 * @param {String} [options.icon0=className]
 * @param {String} [options.icon1=className]
 * @param {Number} [options.min=minVal]
 * @param {Number} [options.max=maxVal]
 * @param {Number} [options.step=stepVal]
 * @param {Number} [options.value=val]
 *
 * @constructor
 * @augments Autodesk.Viewing.UI.Control
 */
avu.Slider = function(id, options) {
    avu.Control.call(this, id, options);

    var self = this;

    this._state = avu.Slider.State.INACTIVE;
    if(options.icon0) {
        this.icon0 = document.createElement("div");
        this.icon0.classList.add('slider-icon');
        this.icon0.classList.add(options.icon0);
        this.container.appendChild(this.icon0);
    }

    this.sliderElement = document.createElement('input');
    this.sliderElement.setAttribute('type','range');
    this.sliderElement.setAttribute('class',options.class ? options.class : '');
    this.sliderElement.setAttribute('min',options.min ? options.min : 0.0);
    this.sliderElement.setAttribute('max',options.max ? options.max : 1.0);
    this.sliderElement.setAttribute('step',options.step ? options.step : 0.01);
    this.sliderElement.setAttribute('value',options.value ? options.value : 0.0);
    this.container.appendChild(this.sliderElement);
    if(options.icon1) {
        this.icon1 = document.createElement("div");
        this.icon1.classList.add('slider-icon');
        this.icon1.classList.add(options.icon1);
        this.container.appendChild(this.icon1);
    }


    this.sliderElement.addEventListener('input', function(event) {
        self.fireEvent(avu.Slider.Event.INPUT);
        if (self.onInput)
            self.onInput(event);
        event.stopPropagation();
    });

    this.sliderElement.addEventListener('change', function(event) {
        self.fireEvent(avu.Slider.Event.CHANGE);
        if (self.onChange)
            self.onChange(event);
        event.stopPropagation();
    });

    // Add rollover only if this is not a touch device.
    if ( !isTouchDevice() ) {
        this.container.addEventListener("mouseover", function(e) {
            self.onMouseOver(e);
        });

        this.container.addEventListener("mouseout", function(e) {
            self.onMouseOut(e);
        });
    }

    this.addClass('adsk-slider');
    this.addClass(avu.Slider.StateToClassMap[this._state]);
};

/**
 * Enum for button event IDs.
 * @readonly
 * @enum {String}
 */
avu.Slider.Event = {
    // Inherited from Control
    VISIBILITY_CHANGED: avu.Control.Event.VISIBILITY_CHANGED,
    COLLAPSED_CHANGED: avu.Control.Event.COLLAPSED_CHANGED,

    STATE_CHANGED: 'Slider.StateChanged',
    INPUT: 'input',
    CHANGE: 'change'
};

/**
 * Enum for slider states
 * @readonly
 * @enum {Number}
 */
avu.Slider.State = {
    ACTIVE: 0,
    INACTIVE: 1,
    DISABLED: 2
};

/**
 * @private
 */
avu.Slider.StateToClassMap = (function() {
    var state = avu.Slider.State;
    var map = {};

    map[state.ACTIVE] = 'active';
    map[state.INACTIVE] = 'inactive';
    map[state.DISABLED] = 'disabled';

    return map;
}());


/**
 * Event fired when state of the button changes.
 *
 * @event Autodesk.Viewing.UI.Slider#STATE_CHANGED
 * @type {Object}
 * @property {String} buttonId - The ID of the button that fired this event.
 * @property {Autodesk.Viewing.UI.Slider.State} state - The new state of the button.
 */

avu.Slider.prototype = Object.create(avu.Control.prototype);
avu.Slider.prototype.constructor = avu.Slider;

/**
 * Sets the state of this slider.
 *
 * @param {Autodesk.Viewing.UI.Slider.State} state - The state.
 *
 * @returns {Boolean} - True if the state was set successfully.
 *
 * @fires Autodesk.Viewing.UI.Slider#STATE_CHANGED
 */
avu.Slider.prototype.setState = function(state) {
    if (state === this._state) {
        return false;
    }
    if(this.hasLabel()) {
        this.label.classList.remove(avu.Slider.StateToClassMap[this._state]);
        this.label.classList.add(avu.Slider.StateToClassMap[state]);
    }

    this.removeClass(avu.Slider.StateToClassMap[this._state]);
    this.addClass(avu.Slider.StateToClassMap[state]);
    this._state = state;

    var event = {
        type: avu.Slider.Event.STATE_CHANGED,
        state: state
    };

    this.fireEvent(event);

    return true;
};

/**
 * Sets the icon for the button.
 *
 * @param {string} iconClass The CSS class defining the appearance of the button icon (e.g. image background).
 */
avu.Slider.prototype.setIcon = function(iconClass) {
    if (this.iconClass)
        this.icon.classList.remove(this.iconClass);
    this.iconClass = iconClass;
    this.icon.classList.add(iconClass);
};

/**
 * Creates a label div to the left of the icon
 * @param {string} labelText The text to be displayed in the label div
 */
avu.Slider.prototype.addLabel = function addLabel(labelText) {
    this.label = document.createElement('div');
    this.label.setAttribute('class','adsk-slider-label');
    this.label.innerHTML = labelText;
    this.container.appendChild(this.label);
};



/**
 * Checks to see if the button has a label or not
 */
avu.Slider.prototype.hasLabel = function hasLabel() {
    return(this.container.querySelector('.adsk-slider-label') ? true : false);
};

/**
 * Returns the state of this button.
 *
 * @returns {Autodesk.Viewing.UI.Slider.State} - The state of the button.
 */
avu.Slider.prototype.getState = function() {
    return this._state;
};

/**
 * Override this method to be notified when the user clicks on the button.
 * @param {MouseEvent} event
 */
avu.Slider.prototype.onClick = function(event) {

};

/**
 * Override this method to be notified when the mouse enters the buton.
 * @param {MouseEvent} event
 */
avu.Slider.prototype.onMouseOver = function(event) {

};

/**
 * Override this method to be notified when the mouse leaves the button.
 * @param {MouseEvent} event
 */
avu.Slider.prototype.onMouseOut = function(event) {

};


})();
;
(function() {

"use strict";

var avu = Autodesk.Viewing.UI;

/**
 * @class
 * This is the core class that represents a ToolSet. It consists of {@link Autodesk.Viewing.UI.ControlGroup|ControlGroups}
 * that group controls by functionality.
 *
 * @alias Autodesk.Viewing.UI.ToolSet
 * @param {String} id - The id for this ToolSet.
 * @param {Object} [options] - An optional dictionary of options.
 * @param {Boolean} [options.collapsible=true] - Whether this ToolSet is collapsible
 *
 * @constructor
 * @augments Autodesk.Viewing.UI.ControlGroup
 * @memberof Autodesk.Viewing.UI
 */
function ToolSet(id, options) {
    avu.ControlGroup.call(this, id, options);

    this.removeClass('adsk-control-group');
    this.addClass('molviewer-toolset');
};

/**
 * Enum for ToolSet event IDs.
 * @readonly
 * @enum {String}
 */
ToolSet.Event = {
    // Inherited from Control
    VISIBILITY_CHANGED: avu.Control.Event.VISIBILITY_CHANGED,
    COLLAPSED_CHANGED: avu.Control.Event.COLLAPSED_CHANGED,

    // Inherited from ControlGroup
    CONTROL_ADDED: avu.ControlGroup.Event.CONTROL_ADDED,
    CONTROL_REMOVED: avu.ControlGroup.Event.CONTROL_REMOVED,
    SIZE_CHANGED: avu.ControlGroup.Event.SIZE_CHANGED
};

ToolSet.prototype = Object.create(avu.ControlGroup.prototype);
ToolSet.prototype.constructor = ToolSet;

Autodesk.Viewing.UI.ToolSet = ToolSet;
})();;AutodeskNamespace('Autodesk.Viewing.Private');

Autodesk.Viewing.Private.ViewCubeUi = function (viewer) {
    this.viewer = viewer;

    this.container = null;
    this.cube = null; // Autocam.ViewCube
    this.viewcube = null;
    this.infoButton = null;
    this.homeViewContainer = null;
};

var avp = Autodesk.Viewing.Private;

Autodesk.Viewing.Private.ViewCubeUi.prototype = {
    constructor: Autodesk.Viewing.UI.ViewCube,

    create: function () {
        var config = this.viewer.config, //default to false turn buttons off please molviewer mz
            wantInfoButton = config && config.wantInfoButton !== undefined ? config.wantInfoButton : false,
            //added this so we can remove the default home button associated with the viewCube
            wantHomeButton = config && config.wantHomeButton !== undefined ? config.wantHomeButton : false;

        this.initContainer();

        if (wantInfoButton) {
            this.initInfoButton();
        }

        if (wantHomeButton) {
            this.initHomeButton();
        }

    },

    initContainer: function() {
        this.container = document.createElement('div');
        this.container.className = "viewcubeUI";
        this.viewer.container.appendChild(this.container);
    },

    initInfoButton: function () {
        if (0 < document.getElementsByClassName('infoButton').length) {
            return;
        }

        this.infoButton = document.createElement('div');
        this.infoButton.className = "infoButton";
        this.infoButton.style.cursor = "pointer";

        this.container.appendChild(this.infoButton);

        var self = this;
        this.infoButton.addEventListener("click", function (e) {
            var propertyPanel = self.viewer.getPropertyPanel(true);
            var visible = !propertyPanel.areDefaultPropertiesShown() || !propertyPanel.isVisible();

            if (visible) {
                propertyPanel.showDefaultProperties();
            }

            if (visible !== propertyPanel.isVisible()) {
                propertyPanel.setVisible(visible);
            }
        });
    },

    initHomeButton: function () {
        if (0 < document.getElementsByClassName('homeViewWrapper').length) {
            return;
        }

        var homeViewContainer = document.createElement('div');
        homeViewContainer.className = "homeViewWrapper";
        homeViewContainer.style.cursor = "pointer";

        this.container.appendChild(homeViewContainer);

        this.homeViewContainer = homeViewContainer;

        var self = this;
        homeViewContainer.addEventListener("click", function(e) {
            self.viewer.navigation.setRequestHomeView(true);
        });

        this._initHomeMenu(homeViewContainer);
    },

    _initHomeMenu: function (parent) {
        var viewer = this.viewer;
        var autocam = viewer.autocam;
        var self    = this;

        this.hideHomeViewMenu = function(e) {
            homeViewMenu.style.display = "none";
            document.removeEventListener("click", self.hideHomeViewMenu );
        };

        // Add the handle for the menu.
        var handle = document.createElement("div");
        handle.className = "homeViewMenuHandle";
        var image = document.createElement('img');
        var iconNormal = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAIGNIUk0AAH7FAACLdgAA9UcAAIsOAABxUAAA6BUAADlYAAAfBMec4XAAAAEBSURBVHja7JcxCsIwFIb/V3oFx04v4iB4A3ev4Ak9iOABOhQcageHDh7iuVSwpW1eYmIFEwiFQvN9SZP/ERIRLNkyLNySQBLIhy+I6AhgE5F5FZHTpACAbV3X61h0Zs5nVwBAJiL0rd+eNuHvnQIArTEmplhrE7gAWEUUePSO/Vg1jJgFvQyYWoFoWTDMgLlNWDFzIyIUqjNzA6DSCpwBlMaYW4iZd+OU3bh2ARG5h5J4h3fj6nIghIQNbg2iTyQ0cFUS+kho4eoodpFwgTvVAo2EK9y5GM1J+MC9quGYhC98shaoPiQqAOwB7Hzhrxn1umMrABy6pxeT0t3w7wWeAwD5qe4YizvzugAAAABJRU5ErkJggg==";
        image.src = iconNormal;
        image.width = image.height = 18;
        handle.appendChild( image );
        handle.addEventListener( "mouseover", function(e) {
            image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAIGNIUk0AAH7FAACLdgAA9UcAAIsOAABxUAAA6BUAADlYAAAfBMec4XAAAAEVSURBVHja7JcxDoJAEEX/rvY2HMEb6AEsaTDxBngKIzfgDBR6AxJtiI0egN7Ght6GWBIYGzVKQHaQDYU7yYSwxb5HMvs3CCJCnyXRcxkBIzAsLwyWpx0ARyNzn29m81oBAE60mmqj237smBkwAl9PAfIssv3Y1kbMs+j9VZQvIyHEGMBI40enRHSpFdCcBR8ZUJcD2rKgnAH1Q5gmnu3HXcOBNPGUBIrQDbqUeMKL0A2UBIjo2pXEO5yIrso50IVEE7wxiH6RUIErJWEbCVW4chRzJDhw1l2gIsGFPzdmNQBLLrZr6R7pcL69WrpHkovtGoDF2o8rUCXRFt5aoCzRFl4pwCwLwOTxBGOeXi3Mv+HfC9wHAAIQ03ZDDGqmAAAAAElFTkSuQmCC";
        });
        handle.addEventListener( "mouseleave", function(e) {
            image.src = iconNormal;
        });

        parent.appendChild( handle );

        // Add the RMB menu.
        var homeViewMenu = document.createElement('div');
        homeViewMenu.className = "homeViewMenu";
        this.viewer.container.appendChild( homeViewMenu );

        var setHome = document.createElement('div');
        setHome.className = "homeViewMenuItem";
        setHome.textContent = Autodesk.Viewing.i18n.translate("Set current view as Home");
        homeViewMenu.appendChild( setHome );

        setHome.addEventListener( "click", function(e) {
            autocam.setCurrentViewAsHome(false);
            self.hideHomeViewMenu(e);
        });

        var focusAndSetHome = document.createElement('div');
        focusAndSetHome.className = "homeViewMenuItem";
        focusAndSetHome.textContent = Autodesk.Viewing.i18n.translate("Focus and set as Home");
        homeViewMenu.appendChild( focusAndSetHome );

        focusAndSetHome.addEventListener( "click", function(e) {
            autocam.setCurrentViewAsHome(true);
            self.hideHomeViewMenu(e);
        });

        var resetHome = document.createElement('div');
        resetHome.className = "homeViewMenuItem";
        resetHome.textContent = Autodesk.Viewing.i18n.translate("Reset Home");
        homeViewMenu.appendChild( resetHome );

        resetHome.addEventListener( "click", function(e) {
            autocam.resetHome();
            self.hideHomeViewMenu(e);
        });

        parent.addEventListener( "mouseover", function(e) {
            if ((viewer.model && viewer.model.is2d()) || (viewer.prefs && !viewer.prefs.viewCube)) {
                handle.style.display = "block";
            }
        });

        parent.addEventListener( "mouseleave", function(e) {
            handle.style.display ="none";
        });

        handle.addEventListener("click", function(e) {
            if ((viewer.model && viewer.model.is2d()) || (viewer.prefs && !viewer.prefs.viewCube)) {
                homeViewMenu.style.display = "block";
                document.addEventListener("click", self.hideHomeViewMenu );
            }
            e.stopPropagation();
        });

        parent.addEventListener( "contextmenu", function(e) {
            if ((viewer.model && viewer.model.is2d()) || (viewer.prefs && !viewer.prefs.viewCube)) {
                homeViewMenu.style.display = "block";
                document.addEventListener("click", self.hideHomeViewMenu );
            }
        });
    },

    setVisible: function (show) {
        this.container.style.display = show ? 'block' : 'none';
    },

    displayViewCube: function (display, updatePrefs) {
        if (updatePrefs)
            this.viewer.prefs.set('viewCube', display);

        if (display && !this.cube) {
            this.viewcube = document.createElement("div");
            this.viewcube.className = "viewcube";
            this.container.appendChild(this.viewcube);
            this.cube = new avp.Autocam.ViewCube("cube", this.viewer.autocam, this.viewcube, LOCALIZATION_REL_PATH);
        }
        else if (!this.cube) {
            this._positionHomeButton();
            return; //view cube is not existent and we want it off? Just do nothing.
        }

        this.viewcube.style.display = (display ? "block" : "none");

        this._positionHomeButton();

        if( display ) {
            this.viewer.autocam.refresh();
        }
    },

    _positionHomeButton: function () {
        if (this.homeViewContainer) {
            var viewCubeVisible = this.cube && this.viewcube && (this.viewcube.style.display === 'block'),
                containerBounds = this.viewer.container.getBoundingClientRect(),
                homeButtonBounds = this.homeViewContainer.getBoundingClientRect(),
                right;

            if (viewCubeVisible) {
                var viewCubeBounds = this.viewcube.getBoundingClientRect();
                right = containerBounds.left + containerBounds.width - viewCubeBounds.left - homeButtonBounds.width;

            } else if (this.infoButton) {
                var infoButtonBounds = this.infoButton.getBoundingClientRect();
                right = containerBounds.left + containerBounds.width - infoButtonBounds.left + infoButtonBounds.width - homeButtonBounds.width;
            } else {
                right = 10;
            }
            this.homeViewContainer.style.right = right + 'px';
        }
    },

    uninitialize: function () {
        if (this.container) {
            this.viewer.container.removeChild(this.container);
            this.viewcube = null;
        }

        this.infoButton = null;

        if (this.cube) {
            this.cube.dtor();
            this.cube = null;
        }

        this.homeViewContainer = null;
        this.hideHomeViewMenu = null;
        this.viewer = null;
    }
};
;/**
 * Created by andrewkimoto on 8/24/15.
 */
//constructor
Autodesk.Nano.CoreViewer = function MolViewer(viewer) {
    this.viewer = viewer;
    this._initialize();
    Autodesk.Nano.CoreViewer._instance = this;
    window.CoreViewer = Autodesk.Nano.CoreViewer._instance;
};


Autodesk.Nano.CoreViewer.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.CoreViewer.prototype;
    me._initializeEvents.call(this);
};

Autodesk.Nano.CoreViewer.prototype.reInitViewer = function reInitViewer() {
    if(this.newURL) {
        var options = TheMolMan.getPDBData(this.newURL);
        delete this.newURL;
        this.initViewer(options);
    }
};


Autodesk.Nano.CoreViewer.prototype._initializeEvents = function _initializeEvents() {

    //check to see if we need to apply a state saved in the URL
    this.viewer.addEventListener(Autodesk.Nano.MODEL_END_LOADED_EVENT, function(e) {if(!e || !e.modelType || e.modelType === 'mol'){
        this.checkState();
    }}.bind(this));
    this.viewer.addEventListener(Autodesk.Viewing.VIEWER_UNINITIALIZED, function() {this.reInitViewer();}.bind(this));
};

Autodesk.Nano.CoreViewer.prototype.resetViewer = function resetViewer(url) {
    var options = TheMolMan.getPDBData(url);
    options = this.getShareOptions(options);
    this.viewer.fireEvent(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED);
    this.newURL = url; //temporarily store the url for use by reInitViewer
    if(TheMolMan.isModelLoaded()) { // if we load without a model, there is no need to run finish()
        this.viewer.finish();
    } else {
        this.viewer.uninitialize();
        this.reInitViewer();
    }
};

Autodesk.Nano.CoreViewer.prototype.initViewer = function initViewer(options) {
    var avp = Autodesk.Viewing.Private;
    avp.initializeLocalization();

    var viewerElement = document.getElementById('viewer3d');
    var vm2d = Autodesk.Nano.CoreViewer.ViewManager2D._instance;
    var viewer = new avp.GuiViewer3D(viewerElement, options);
    var molMan = new Autodesk.Nano.CoreViewer.MolViewerMan(viewer); //create new molViewerMan
    var svfURL = options.svf;
    var documentId = options.documentId;

    this.svf = svfURL.split('/')[svfURL.split('/').length -1].replace(/\.svf$/,'');

    options.env = "Local";
    Autodesk.Viewing.Initializer(options, function(){viewer.start();viewer.load(svfURL);});
    if(!ViewManager.getTopView('BrowserView')) {
        Loader.loadTopViews(viewer,svfURL);
    } else {
        vm2d.updateViewer(viewer,svfURL);
    }
    this._initialize();
};

// Info on the parameters
// https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
Autodesk.Nano.CoreViewer.prototype.setCookieItem =  function setCookieItem(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
        switch (vEnd.constructor) {
            case Number:
                sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                break;
            case String:
                sExpires = "; expires=" + vEnd;
                break;
            case Date:
                sExpires = "; expires=" + vEnd.toUTCString();
                break;
        }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) +
                      sExpires + (sDomain ? "; domain=" + sDomain : "") +
                      (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
};

//restore custom options from url string (used when viewer is re-created after
//loading a pdb/cadnano file from the file menu).
Autodesk.Nano.CoreViewer.prototype.getShareOptions = function getShareOptions(options) {
    var viewerOnly = Autodesk.Viewing.Private.getParameterByName("vieweronly");
    var showViewCube =  Autodesk.Viewing.Private.getParameterByName("viewcube");
    var noSplash =  Autodesk.Viewing.Private.getParameterByName("nosplash");
    options.viewerOnly = (viewerOnly === 'true');
    options.showViewCube = (showViewCube !== 'false');
    options.noSplash = (noSplash === 'true');
    return options;
};


Autodesk.Nano.CoreViewer.prototype.checkState = function checkState() {
    var url = document.location.href;
    if (url.match(/&state=/)) {
        this.restoreMolViewerState();
    } else {
        TheMolMan.setDefaultReps(true);
        this.viewer.utilities.fitToView();
    }
};

//need to redo this mz
Autodesk.Nano.CoreViewer.prototype.getMolViewerState = function getMolViewerState() {
    var jsonObj = this.viewer.getState({seedURN: true, viewport: true, cutplanes: true, measure: true});
    if (typeof TheAnnotateMan !== "undefined") {
        jsonObj.annotate = TheAnnotateMan.toJSONObj();
    }
    jsonObj.mol =  TheMolMan.toJSONObj();
    return jsonObj;
};

Autodesk.Nano.CoreViewer.prototype.getViewerURL = function getViewerURL(args) {
    var viewCube = true;
    var noSplash = true;
    var state = this.getMolViewerState();
    var svfParam = state.seedURN;
    var host = document.location.host;
    delete state.seedURN;
    var stateParam = /*encodeURI */(JSON.stringify(state));//no longer encodeURI since it's compressed

    stateParam = /*encodeURI*/(LZString144.compressToEncodedURIComponent(stateParam));
    return 'http://' + host + '/?svf=' + svfParam +'&viewcube=' + viewCube + '&hB=' + args.hideBrowser + '&hI=' +args.hideInspector + '&hH=' + args.hideHeader + '&dB=' + args.disableBrowser + '&dI=' + args.disableInspector + '&nosplash=' + noSplash + '&state=' + stateParam;
};

// Returns the html to be embedded in an iframe
Autodesk.Nano.CoreViewer.prototype.getViewerFrame = function getViewerFrame(width,height) {
    var args = {hideBrowser: false, hideInspector: false, hideHeader: true, disableBrowser: true, disableInspector: true};
    var url = this.getViewerURL(args);
    height = height ? height : '550px';
    width = width ? width : '980px';
    return '<iframe style = "height: ' + height + '; width: ' + width + ';" src="' + url +  '"></iframe>';
};

Autodesk.Nano.CoreViewer.prototype.restoreMolViewerState = function restoreMolViewerState() {
    var url = document.location.href,
        paramString = url.split('?')[1],
        params = paramString.split('&'),
        svf = paramString.split('/')[paramString.split('/').length -1].replace(/\.svf.+/,''),
        i,
        stateString,
        stateObj;
    for(i = 0;i < params.length;i++) {
        if (params[i].match(/^state=/)) {
            stateString = params[i].replace(/^state=/, '');
            stateString = LZString144.decompressFromEncodedURIComponent((stateString));
            i = params.length;
        }
    }

    if(!stateString) {
        return;
    }
    stateObj = JSON.parse(stateString);
    TheMolMan.fromJSONObj(stateObj);
};


Autodesk.Nano.CoreViewer.prototype.updateMolViewer = function updateMolViewer(viewer) {
    this.viewer = viewer;
    Autodesk.Nano.CoreViewer._instance = this;
    window.CoreViewer = Autodesk.Nano.CoreViewer._instance;
};


;/**
 * Created by andrewkimoto on 9/8/15.
 */
Autodesk.Nano.EventQueue = function EventQueue(viewer,method,timeout,eventName,eventTarget) {
    var self = this;
    this.viewer = viewer;
    this.eventName = eventName;
    this.eventTarget = eventTarget;
    this.timedMethod = method;
    this.timeout = timeout;
    this._timer = null;
    this._queue = [];
    this._initializeEvents();
    Autodesk.Nano.EventQueue._instance = this;
    window.MolEventQueue = Autodesk.Nano.EventQueue._instance;
};

Autodesk.Nano.EventQueue.prototype._initializeEvents = function _initializeEvents() {
    var self = this;

    this.clearTimedEvent = function clearTimedEvent() {
        window.clearTimeout(self._timer);
        self._timer = null;
    };

    //Check to see if there is an event already in the queue.  If such an event exists,
    //clear the queue and add the new event
    this.checkEvent = function checkEvent(event) {
        if(self._timer) {
            self.clearTimedEvent();
        }
        self.addTimedEvent(event);
    };

    // fire the event if timeout expires before another event takes its place
    this.fireTimedEvent = function fireTimedEvent(event) {
        self.timedMethod(event);
        self._timer = null;
    };

    // add an event to the queue, to be fired after timeout period expires
    this.addTimedEvent = function addTimedEvent(event) {
        self._timer = window.setTimeout(self.fireTimedEvent,150,event);
    };

    this._unbindEvents = function _bindEvents() {
        if (self.eventTarget) { //  DOM Event
            self.eventTarget.removeEventListener(self.eventName, self.checkEvent);
        } else {
            self.viewer.removeEventListener(self.eventName, self.checkEvent);
        }
    };

    this._bindEvents = function _bindEvents() {
        if (self.eventTarget) { //  DOM Event
            self.eventTarget.addEventListener(self.eventName, self.checkEvent);
        } else {
            self.viewer.addEventListener(self.eventName, self.checkEvent);
        }
    };

    if (this.eventTarget) { //  DOM Event
        this.eventTarget.addEventListener(this.eventName, this.checkEvent);
    } else {
        this.viewer.addEventListener(this.eventName, this.checkEvent);
    }
};

Autodesk.Nano.EventQueue.prototype.updateViewer = function updateViewer(viewer) {
    this.viewer = viewer;
    this._bindEvents();
};;// set up namespace...
Autodesk.Nano = Autodesk.Nano || {};



/**
 * This object is used to create a hold a byte buffer for creating an rgba texture
 * that holds for each item a specific color.
 * This is used for coloring, drawing the selection, and now for creating the id texture.
 * @param ni The number of items, in our case atoms.
 * @constructor
 */
Autodesk.Nano.GetUVs = function(ni) {
    this.numItems = ni;
    var sq = Math.sqrt(this.numItems);
    this.width = Math.ceil(sq);
    this.height = this.width;
    this.step = 1.0/(this.width);
    this.halfStep = this.step *0.5;
    var bigSize = 3 * this.width * this.height;
    this.data = new Uint8Array(bigSize);
    var val  = 0;
    for ( var i = 0; i < bigSize; i ++ ) {
        this.data[ i  ] 	= val;
    }
    this.setColor= function(itemNum,r,g,b){
        var v = 3*itemNum;
        this.data[ v ] 	= r;
        this.data[ v + 1 ] 	= g;
        this.data[ v  + 2 ] 	= b;

    };
    this.setThreeColor = function(itemNum,color){
        var v = 3*itemNum;
        var val = color.toArray();
        this.data[ v ] = val[0] * 0xff;
        this.data[ v + 1 ] = val[1] * 0xff;
        this.data[ v + 2 ] = val[2] * 0xff;

    };
    this.getColor = function(itemNum, obj){
        var v = 3*itemNum;
        obj.r = this.data[ v ];
        obj.g = this.data[ v + 1 ];
        obj.b = this.data[ v + 2 ];

    };
    //alpha textures are also 3 channels for some reason
    this.setAlpha= function(itemNum,a){
        this.data[ 3* itemNum  ] 	= a;
        this.data[ 3* itemNum + 1 ] 	= a;
        this.data[ 3* itemNum + 2 ] 	= a;


    };
    this.getAlpha = function(itemNum){
        return this.data[3*itemNum];
    };

    this.getUV = function(itemNum){
        var whichRow = Math.floor(itemNum/this.width);
        var u,v;

        v = this.halfStep + whichRow * this.step;
        u = this.halfStep + (itemNum - whichRow*this.width) * this.step;

        return new THREE.Vector2(u,v);
    };

    this.getUV2 = function (itemNum, vector){

        var whichRow = Math.floor(itemNum/this.width);
        var u,v;

        v = this.halfStep + whichRow * this.step;
        u = this.halfStep + (itemNum - whichRow*this.width) * this.step;
        vector.u = u;
        vector.v = v;
    }
};

;/**
 *
 * @param modelType, a period separating string defining the namespace and the type of the instance
 * @param id
 * @constructor
 */
Autodesk.Nano.Instance = function(modelType,id) {
    this.id =  id ? id :  null;
    this.modelType =  modelType ? modelType : "unknown";
    this.selection = {};
    this.model = null; //model that holds it
    this.selected = false;
    //mz will be needed for molview
};


Autodesk.Nano.Instance.prototype.initialize = function initialize() {
    return true;
};

Autodesk.Nano.Instance.prototype.dtor = function dtor() {
    return true;
};

Autodesk.Nano.Instance.prototype.setModel = function setModel(model) {
    this.model = model;
};

Autodesk.Nano.Instance.prototype.setID = function  setID(id){
    this.id = id;
};

Autodesk.Nano.Instance.prototype.getID = function getID(){
    return this.id;
};

Autodesk.Nano.Instance.prototype.select = function select(val) {
    this.selected = val;
};

Autodesk.Nano.Instance.prototype.getSelected = function getSelected() {
    return this.selected;
};

Autodesk.Nano.Instance.prototype.getNameSpace = function getModelTypeNameSpace(){
    var str = this.modelType.split('.');
    if(str.length !== 2){
        return 'unknown';
    }else{
        return str[0];
    }

};

Autodesk.Nano.Instance.prototype.getType = function getType(){
    var str = this.modelType.split('.');
    if(str.length !== 2){
        return 'unknown';
    }else{
        return str[1];
    }
};

//mz not sure about putting it here or as part of the view but it's
//okay for now
/**
 * Get instances that are 'connected' to this one
 * @param strong  instances that are connected strongly to this one
 * @param weak   instances that are connected weakly to this instance
 */
Autodesk.Nano.Instance.prototype.getConnectedInstances = function getConnectedInstances(strong,weak) {

};;
//instace should have id, modelType and dtor function...
//and also
/*
 Autodesk.Viewing.MolViewer.MolInstance.prototype.getSelection= function getSelection() {
 return this.selection;
 };

 Autodesk.Viewing.MolViewer.MolInstance.prototype.clearSelection = function clearSelection(nofire) {
 this.selection.instanceSelected = false;
 this.selection.chain = [];
 this.selection.residue = [];
 this.selection.atom = [];
 this.selection.atomID.clear();
 this.atomSelectionState.clearSelection(); //this will clear up the atoms
 //firing events moved back to model
 };

 */

/*
 There will be a basic set of events as part of the core API. They will also
 Events:
 MODEL_LOADED
 INSTANCE_ADDED
 INSTANCE_DELETED
 INSTANCE_SELECTED
 (* We may add more, like a METADATA_LOADED


 Autodesk.Viewing.GEOMETRY_LOADED_EVENT
 Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT
 Autodesk.Viewing.METADATA_LOADED_EVENT = 'metadataLoaded';

 */

/*
Application
DNA.
HitTest, get all intersected, see which is selected based on other information.
Virtual Helix, Strand, Base, Phosphate, Backbone
and dna model id.

MolViewer..
HitTest3d, then also do 2d and get atomID
just have Instance, atom id, and model id.

Instance.Api

.id
.modelType
.selection (object)


 */




/**
 * The InstanceManager manages instances.
 * TODO
 *
 * @constructor
 */
Autodesk.Nano.InstanceManager = function (viewer) {
    var _models = {}; //models hold instances also
    var _instances = {};
    var _selectedInstances = {};
    var _viewer = viewer;

    var _colorMap = {};
    _colorMap['cylinder'] = { // maps cadnano colors to nanodesign viewer colors
        16777215: 16777215, //255,255,255
        13369344: 0x80212f, //204, 0, 0 => 255, 65, 95
        16204552: 0x802200, //247, 67, 0 => 255, 123, 76
        16225054: 0x7f4704, //247, 147, 30 => 255, 195, 91
        11184640: 0x568031, //170, 170, 0 => 132, 195, 75
        5749504:  0x328045, //87, 187, 0 => 72, 183, 98
        29184:   0x1a6e57 , //0, 114, 0 => 26, 110, 87
        243362:  0x408080 , //3, 182, 162 => 102, 204, 203
        1507550:  0x2d3c80, //23, 0, 222 => 70, 94, 201
        7536862:  0x543980, //115, 0, 222 => 168, 115, 255
        12060012: 0x7f2353, //184, 5, 108 => 219, 60, 142
        3355443:  0x646980, //51, 51, 51 => 73, 77, 93
        8947848:   0x747680//136, 136, 136 => 161, 163, 176
    };



    _colorMap['strand'] = { // maps cadnano colors to nanodesign viewer colors
        16777215: 16777215, //255,255,255
        13369344: 16728415, //204, 0, 0 => 255, 65, 95
        16204552: 16743244, //247, 67, 0 => 255, 123, 76
        16225054: 16761691, //247, 147, 30 => 255, 195, 91
        11184640: 8700747, //170, 170, 0 => 132, 195, 75
        5749504:  4765538, //87, 187, 0 => 72, 183, 98
        29184:    1732183, //0, 114, 0 => 26, 110, 87
        243362:   6737099, //3, 182, 162 => 102, 204, 203
        1507550:  4611785, //23, 0, 222 => 70, 94, 201
        7536862:  11039743, //115, 0, 222 => 168, 115, 255
        12060012: 14367886, //184, 5, 108 => 219, 60, 142
        3355443:  4803933, //51, 51, 51 => 73, 77, 93
        8947848:  10593200 //136, 136, 136 => 161, 163, 176
    };

    function getViewer(){
        return _viewer;
    }
    function getInstances() {
        var dudes = [];
        var instance;
        for (var id in _instances) {
            instance = _instances[id];
            dudes.push(instance);
        }
        return dudes;
    }

    function getInstancesByType(type) {
        var dudes = [],
            instance;
        for (var id in _instances) {
            if (_instances.hasOwnProperty(id)) {
                if(_instances[id].modelType === type) {
                    instance = _instances[id];
                    dudes.push(instance);
                }
            }
        }
        return dudes;
    }

    function getInstancesById(ids) {
        var i,
            dudes = [];
        if (ids instanceof Array) {
            for(i = 0; i < ids.length; ++i) {
                if(_instances[ids[i]]) {
                    dudes.push(_instances[ids[i]]);
                }
            }
        } else {
            dudes.push(_instances[ids]);
        }
        return dudes;
    }

    function getModels() {
        var dudes = [];
        var model;
        for (var id in _models) {
            model = _models[id];
            dudes.push(model);
        }
        return dudes;
    }

    function getModel(id) {
        return _models[id];
    }

    function addModel(models) {
        var model,event,dudes;
        if(models instanceof Array){
            dudes = models;
        }
        else {
            dudes = [];
            dudes.push(models);
        }
        for(var i =0;i< dudes.length;++i){
            model = dudes[i];
            if (!model.id) {
                model.id = THREE.Math.generateUUID();
            }
            if (!model.modelType) {
                model.modelType = "unknown";
            }
            //todo need to handle if id is already there
            _models[model.id] = model;
        }
        event = {
            type: Autodesk.Nano.MODEL_ADDED_EVENT,
            model: model
        };
        _viewer.fireEvent(event);

    }

    /**
     * this doesn't delete the instance for the model
     * @param models
     */
    function deleteModel(models) {
        var id,model,event,dudes;

        if(!models) {
            //this deletes all
            for (id in _models) {
                event = {
                    type: Autodesk.Nano.MODEL_DELETED_EVENT,
                    model: _instances[id]
                };
                _viewer.fireEvent(event);
                //mz need to handle this special case if (this.instances[i].molModel.instance != this.instances[i]) {
                _models[id].dtor();
                // }
            }
            _models = {};
        }else{
            if(models instanceof Array){
                dudes = models;
            }
            else
            {
                dudes = [];
                dudes.push(models);
            }
            for(var i = 0;i< dudes.length;++i){
                if(_models[dudes[i].id]){
                    id = dudes[i].id;
                    model = dudes[i];
                    event = {
                        type: Autodesk.Nano.MODEL_DELETED_EVENT,
                        model: model
                    };
                    _viewer.fireEvent(event);
                    delete _models[id];

                    model.dtor();
                }
            }
        }


        var event = {
            type: Autodesk.Nano.INSTANCES_CHANGED_EVENT,
            instances: _instances
        };
        _fireInstancesChangedEvent();
        /*
         needs to get handled by an event
         for (var j = 0; j < this.molModels.length; ++j) {
         this.molModels[j].deleteInstances();
         }
         */

    }

    function getSelectedInstances(){
        var dudes = [];
        var instance;
        for (var id in _selectedInstances) {
            instance = _selectedInstances[id];
            dudes.push(instance);
        }
        return dudes;
    }

    /**
     * Add instance
     *
     * @param instance
     */
    function addInstance(instances) {
        var instance,event,dudes;
        if(instances instanceof Array){
            dudes = instances;
        }
        else
        {
            dudes = [];
            dudes.push(instances);
        }
        for(var i =0;i< dudes.length;++i){
            instance = dudes[i];
            if (!instance.id) {
                instance.id = THREE.Math.generateUUID();
            }
            if (!instance.modelType) {
                instance.modelType = "unknown";
            }
            //todo need to handle if id is already there
            _instances[instance.id] = instance;
        }
        event = {
            type: Autodesk.Nano.INSTANCE_ADDED_EVENT,
            instance: instance
        };
        _viewer.fireEvent(event);

        _fireInstancesChangedEvent();

    }

    /**
     * Remove Instances
     * Doesn't delete the model
     * @param [] array of instances to delete
     */
    function deleteInstance(instances) {
        var id,instance,event,dudes;

        if(!instances) {
            //this deletes all
            clearSelection(); //clear everything
            for (id in _instances) {
                event = {
                    type: Autodesk.Nano.INSTANCE_DELETED_EVENT,
                    instance: _instances[id]
                };
                _viewer.fireEvent(event);
                //mz need to handle this special case if (this.instances[i].molModel.instance != this.instances[i]) {
                _instances[id].dtor();
               // }
            }
            _instances = {};
        }else{
            if(instances instanceof Array){
                dudes = instances;
            }
            else
            {
                dudes = [];
                dudes.push(instances);
            }
            selectInstances(instances,false,true);
            for(var i = 0;i< dudes.length;++i){
                if(_instances[dudes[i].id]){
                    id = dudes[i].id;
                    instance = dudes[i];
                    event = {
                        type: Autodesk.Nano.INSTANCE_DELETED_EVENT,
                        instance: instance
                    };
                    _viewer.fireEvent(event);
                    delete _instances[id];

                    //mz need to handle this special case if (this.instances[i].molModel.instance != this.instances[i]) {
                    instance.dtor();
                    // }

                }
            }
        }


        var event = {
            type: Autodesk.Nano.INSTANCES_CHANGED_EVENT,
            instances: _instances
        };
        _fireInstancesChangedEvent();
        /*
        needs to get handled by an event
        for (var j = 0; j < this.molModels.length; ++j) {
            this.molModels[j].deleteInstances();
        }
        */

    }

    function clearSelection(){
        var event, id, instance;
        var instances = [];

        for (id in _selectedInstances) {
            instance = _selectedInstances[id];
            instances.push(instance);
        }

        event = {
            type: Autodesk.Nano.INSTANCE_SELECTION_CLEARED_EVENT,
            instances: instances
        };
        _viewer.fireEvent(event);
        for (id in _selectedInstances) {
            _selectedInstances[id].select(false);
                _fireSelectionChangedEvent(_selectedInstances[id]);

        }
        _selectedInstances = {};
        _fireSelectionsSetChangedEvent();

    }

    /**
     * Select Some Instances
     *
     * @param instances array of instances (or instance ids) to select
     * @param val boolean select or not
     * @param keepSelection boolean keep previous selection or not

     */
    function selectInstances(instances,val,keepSelection) {
        val = val ? true: false; //make sure true or false
        var i, dudes;

        if (instances instanceof Array){

            if (typeof instances[0] === 'string') {
                dudes = this.getInstancesById(instances);
            } else {
                dudes = instances;
            }

        } else {
            dudes = [];

            if (typeof instances === 'string') {
                dudes.push(this.getInstance(instances));
            } else {
                dudes.push(instances);
            }
        }

        if (!keepSelection){
            clearSelection();
        }
        for (i = 0; i < dudes.length; i++) {
            if (dudes[i].getSelected() !== val) {
                dudes[i].select(val);
                if(val){
                    _selectedInstances[dudes[i].id] = dudes[i];
                }else{
                    delete _selectedInstances[dudes[i].id];
                }
                _fireSelectionChangedEvent(dudes[i]);
            }
        }
        _fireSelectionsSetChangedEvent();
    }

    /**
     * Toggle Selection on Some Instances
     *
     * @param instances array of instances (or instance ids) to toggle
     */
    function toggleSelection(instances) {
        var i, dudes,val;

        if (instances instanceof Array){

            if (typeof instances[0] === 'string') {
                dudes = this.getInstances(instances);
            } else {
                dudes = instances;
            }

        } else {
            dudes = [];

            if (typeof instances === 'string') {
                dudes.push(this.getInstance(instances));
            } else {
                dudes.push(instances);
            }
        }

        for (i = 0; i < dudes.length; i++) {
            val = dudes[i].getSelected() ? false :true;
            dudes[i].select(val);
            if(val){
                _selectedInstances[dudes[i].id] = dudes[i];
            }else{
                delete _selectedInstances[dudes[i].id];
            }
            _fireSelectionChangedEvent(dudes[i]);
        }
        _fireSelectionsSetChangedEvent();
    }


    /*
        Private Functions
     */
    function _fireSelectionChangedEvent(instance) {

        var event = {
            type: Autodesk.Nano.INSTANCE_SELECTION_CHANGED_EVENT,
            instance: instance
        };
        _viewer.fireEvent(event);
    }
    function _fireSelectionsSetChangedEvent(){
        var event = {
            type: Autodesk.Nano.INSTANCES_SET_SELECTION_CHANGED_EVENT
        };
        _viewer.fireEvent(event);
    };
    function _fireInstancesChangedEvent(){
        var event,newInstances;
        newInstances = getInstances();
        event = {
            type: Autodesk.Nano.INSTANCES_CHANGED_EVENT,
            instances: newInstances
        }
        _viewer.fireEvent(event);

    }

    function getViewer(){
        return _viewer;
    }

    function getInstance(id){
        return _instances[id];
    }

    function addCrossoverDensity(){
        //x: 0.8660254037844385, y: 0, z: 0.5000000000000002}

        /*
        var vhelices = TheNanoMan.getInstancesByType()
        Store in a Metadata JSON.
            (Will helix info in general go automatically to metadata json?)

        Helix{
            Array CrossoverDirections[]; //three(honeycomb) or four(square), maybe more for off lattice
        }

        CrossoverDirections {
            Vector3 unitDirection; //direction from center of helix to connection with next lattice
            Float angleWidth (radians); //width around that direction that defines the pie piece.
            Array CrossoverInformation[]; //array for each crossover location, every 21 or 24 bases for lattices
        }

        CrossoverInformation{
            Index firstBaseIndex; //relative from vHelixStart. Since crossover's are double crossovers this is the index to the first one.
            StapleConnectivity {
                StapleID  firstStapleID; //may be null if not
                Index firstStapleBaseIndex //from 5 to 3
                StapleID secondStapleID;
                Index secondStapleBaseIndex; //3 to 5
            }
        }
        */
    }

    function test4(){
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET','res/testDNA/fourhelix_vis.json',true);
        xhr.setRequestHeader("Connection-ID", Loader.getConnectionID());
        xhr.onload = function(e) {
            if (xhr.status === 200) {
                self.data = JSON.parse(xhr.response);
                self.setUpFromJSON(self.data);
            } else {
                console.log('error', e);
            }
        };
        xhr.onerror = function(e) {
            console.log('error',e);

        };
        xhr.send();
    }

    //load a file from path or url
    // To load the 2D Autodesk A, open chrome dev tools and enter:
    // TheNanoMan.testLoader('res/testDNA/AutodeskA_viewer.json')
    function testLoader(filePath){
        ViewManager.getTopView('StatusView').showCustomMessage('Loading model...');
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET',filePath,true);
        xhr.setRequestHeader("Connection-ID", Loader.getConnectionID());
        xhr.onload = function(e) {
            if (xhr.status === 200) {
                self.data = JSON.parse(xhr.response);
                self.setUpFromJSON(self.data);
            } else {
                console.log('error', e);
            }
        };
        xhr.onerror = function(e) {
            console.log('error',e);

        };
        xhr.send();
    }


    function testSquare(){
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET','res/testDNA/squarenut_viewer.json',true);
        xhr.setRequestHeader("Connection-ID", Loader.getConnectionID());
        xhr.onload = function(e) {
            if (xhr.status === 200) {
                self.data = JSON.parse(xhr.response);
                self.setUpFromJSON(self.data);
            } else {
                console.log('error', e);
            }
        };
        xhr.onerror = function(e) {
            console.log('error',e);

        };
        xhr.send();
    }

    //not exposed but maybe should
    function deleteScene(){
        //refresh the tools
        /* need to finish turning off the tools
        var tc = _viewer.toolController;
        var dt = tc.getDefaultTool();
        var name;
        var tool;
        name = tc.getActiveToolName();
        while (name !== dt.getName()) {
            tool = tc.getTool(name);


            name = tc.getActiveToolName();
        };
        */
        var models = TheNanoMan.getModels();
        TheNanoMan.deleteModel(models);
        var instances = TheNanoMan.getInstances();
        TheNanoMan.deleteInstance(instances);
    }

    function transformSpaces(name) {
        return name.replace(/ /g,'_');
    }

    function setUpFromJSON(data){
        //start by deleting all

        deleteScene();
        function rgbToHex(type,colorArray){
            var clr = (colorArray[0] * 255 ) << 16 ^ ( colorArray[1]* 255 ) << 8 ^ ( colorArray[2] * 255 ) << 0;
            return _colorMap[type][clr];
        }

        var strandObjs = [];
        var domainObjs = {};
        var i;
        var obj;
        var o;
        var j;
        var instance;
        var modelName = transformSpaces(data.model_name);
        var options = {latticeType: data.lattice_type};
        var model = new Autodesk.Nano.DnaDesign.OrigamiModel(modelName,options);
        var event = {
            type: Autodesk.Nano.MODEL_START_LOADED_EVENT,
            modelType : 'dna.origami',
            model : model
        };

        var arraySort = function arraySort(meltingPoints) {
            var i,
                j,
                tmp;
            for (i = 1; i < meltingPoints.length; i++) {
                tmp = meltingPoints[i];
                j = i;
                while (meltingPoints[j - 1] > tmp) {
                    meltingPoints[j] = meltingPoints[j - 1];
                    --j;
                }
                meltingPoints[j] = tmp;
            }

            return meltingPoints;
        };


        _viewer.fireEvent(event);

        for(i = 0; i < data.strands.length;++i){
            o = data.strands[i];
            obj = {
                id: 's.' + o.id.toString(),
                isScaffold: o.is_scaffold,
                isCircular: o.is_circular,
                numOfBases: o.number_of_bases,
                radius:2.15/2,
                strandColor : rgbToHex('strand',o.color),
                cylinderColor:  rgbToHex('cylinder',o.color)
            };
            instance = new Autodesk.Nano.DnaDesign.StrandInstance(obj.id,obj);
            strandObjs.push(instance);
            model.addStrand(instance);
        }
        var parentStrand;
        var min = 999999;
        var max = -999999;
        var temp;
        var domainRadius = data.virtual_helices ? data.virtual_helices[0].radius : 1.25;
        data.meltingPointTemps = [];
        var s;
        for(j = 0; j < data.strands.length;++j) {
            s = data.strands[j];
            for (i = 0; i < s.domains.length; ++i) {
                o = data.domains[s.domains[i]];
                if (o.melting_temperature) {
                    temp = o.melting_temperature;
                } else {
                    temp = -500;
                }

                obj = {
                    id: 'd.' + o.id.toString(),
                    numOfBases: o.number_of_bases,
                    startPos: {x: o.start_position[0], y: o.start_position[1], z: o.start_position[2]},
                    upVec: {x: o.orientation[0], y: o.orientation[1], z: o.orientation[2]},
                    //length: 3.32,
                    endPos: {x: o.end_position[0], y: o.end_position[1], z: o.end_position[2]},
                    basePointStart: o.start_base_index,
                    basePointEnd: o.end_base_index,
                meltingPointTemp: temp,
                    radius: domainRadius
                };
                if (temp > -300) {
                    if (temp < min) {
                        min = temp;
                    } else if (temp > max) {
                        max = temp;
                    }
                }
                parentStrand = strandObjs[o.strand_id];
                instance = new Autodesk.Nano.DnaDesign.DomainInstance(obj.id, obj);
                domainObjs[o.id] = instance;
                parentStrand.addDomain(instance);
                if (parentStrand.isScaffold && temp > -500) { //exclude 'low' temps from the array
                    data.meltingPointTemps.push(temp);
                }
            }
        }
        data.meltingPointTemps = arraySort(data.meltingPointTemps);
        data.maxTemp = max;
        data.minTemp = min;
        //set up strandpoints
        for(i =0; i < strandObjs.length;++i){
            strandObjs[i].setBasesFromJSON(data.strands[i].bases);
        }

        // domain.setComplementaryDomain, domain.strandPartStart/end and isStrandAndDomainInSingleHelix
        for(i in domainObjs){
            o = data.domains[i];
            if(o.connected_domain >=0){
                var d = domainObjs[o.connected_domain];
                domainObjs[i].setComplementaryDomain(d);
            }
        }
        var vhelixCreator =  new Autodesk.Nano.DnaDesign.VHelicesCreator(model.getID() + '.' +'vhelix');
        var vhelices = vhelixCreator.createFromJSON(data.virtual_helices,strandObjs,domainObjs);


        TheNanoMan.addModel(model);
        TheNanoMan.addInstance(model);
        for(var z = 0; z < vhelices.length;++z) {
            model.addVhelix(vhelices[z]);
            TheNanoMan.addInstance(vhelices[z]);
        }
        for(i =0; i < strandObjs.length;++i){
            TheNanoMan.addInstance(strandObjs[i]);
        }
        for(i  in domainObjs){
            TheNanoMan.addInstance(domainObjs[i]);
        }
        var event = {
            type: Autodesk.Nano.MODEL_END_LOADED_EVENT,
            modelType : 'dna.origami',
            model : model
        };


        _viewer.fireEvent(event);
        _viewer.navigation.setRequestHomeView(true);
        _viewer.utilities.fitToView(true);

    }

    function testNanoJSONObj(){
/**
        Base: 0.15 nm radius    Base = 3 a diamter
        No phosphates are shown
        Strand: 0.05 nm radius
        Cylinder: 2.15 nm radius, 0.332 nm height per base
        Cylinder extends to adjacent phosphates
        Arrowheads donâ€™t stick out of cylinder
        Start/End arrow: 0.2 nm height, 0.12 nm radius. Counts as base
        Rise/turn per base are measured from center of base to center of base
        Diameter is measured from center of base to center of base
*/

        var numOfTotalBases = 40;
        var strandObj = {
            id : 'scaffold',
            isScaffold: true,
            numOfBases: numOfTotalBases, //.332nm * 40 = length
            sequence: [],
            color: 0xffffff,
            radius: 2.15/2,
            domains: []
        };

        var domain1 = {
            id : '1',
            numOfBases: numOfTotalBases/4, //*.332 = length
            startPos: {x:10,y:0,z:0},
            upVec: {x:0,y:0,z:1},
            length: 3.32,
            radius: 2.15/2
        };
        var domain1a = {
            id : '1a',
            numOfBases: numOfTotalBases/4,
            startPos: {x:10,y:0,z:3.32 +.332},
            upVec: {x:0,y:0,z:1},
            length: 3.32,
            radius: 2.15/2
        };
        var domain2 = {
            id : '2',
            numOfBases: numOfTotalBases/4,
            startPos: {x:7.85,y:0,z:6.64 +.332},
            upVec: {x:0,y:0,z:-1},
            length: 3.32,
            radius: 2.15/2
        };
        var domain2a = {
            id : '2a',
            numOfBases: numOfTotalBases/4,
            startPos: {x:7.85,y:0,z:3.32},
            upVec: {x:0,y:0,z:-1},
            length: 3.32,
            radius: 2.15/2
        };

        var stapleObj = {
            id : 'staple',
            isScaffold: false,
            numOfBases: numOfTotalBases/2,
            sequence: [],
            color : 0xff0000,
            domains: []
        };

        var domain3 = {
            id : '3',
            numOfBases: numOfTotalBases/4,
            startPos: {x:10,y:0,z:3.32},
            upVec: {x:0,y:0,z:-1},
            length: 3.32,
            radius: 2.15/2
        };
        var domain4 = {
            id : '4',
            numOfBases: numOfTotalBases/4,
            startPos: {x:7.85,y:0,z:0.0},
            upVec: {x:0,y:0,z:1},
            length: 3.32,
            radius: 2.15/2
        };
        var model = new Autodesk.Nano.DnaDesign.OrigamiModel('origami');

        var event = {
            type: Autodesk.Nano.MODEL_START_LOADED_EVENT,
            modelType : 'dna.origami',
            model : model
        };
        //set up complementary domains.
        //domain3.complementaryDomain = domain1;
        //domain4.complementaryDomain = domain2a;

        _viewer.fireEvent(event);
        var strandInstance = new Autodesk.Nano.DnaDesign.StrandInstance(strandObj.id,strandObj);
        var d1 = new Autodesk.Nano.DnaDesign.DomainInstance(domain1.id,domain1);
        strandInstance.addDomain(d1);
        var d1a = new Autodesk.Nano.DnaDesign.DomainInstance(domain1a.id,domain1a);
        strandInstance.addDomain(d1a);
        var d2 = new Autodesk.Nano.DnaDesign.DomainInstance(domain2.id,domain2);
        strandInstance.addDomain(d2);
        var d2a = new Autodesk.Nano.DnaDesign.DomainInstance(domain2a.id,domain2a);
        strandInstance.addDomain(d2a);
        strandInstance.calculatePointsBases();


        var staple =  new Autodesk.Nano.DnaDesign.StrandInstance(stapleObj.id,stapleObj);
        var d3 = new Autodesk.Nano.DnaDesign.DomainInstance(domain3.id,domain3);
        staple.addDomain(d3);
        var d4 = new Autodesk.Nano.DnaDesign.DomainInstance(domain4.id,domain4);
        staple.addDomain(d4);
        staple.calculatePointsBases();

        d1.setComplementaryDomain(d3);
        d3.setComplementaryDomain(d1);
        d4.setComplementaryDomain(d2a);
        d2a.setComplementaryDomain(d4);

        //order matters here need to to vhelices first
        var strands  = [];
        strands.push(strandInstance);
        var vhelixCreator =  new Autodesk.Nano.DnaDesign.VHelicesCreator(model.getID() + '.' +'vhelix');
        var vhelices = vhelixCreator.create(strands);

        TheNanoMan.addModel(model);
        TheNanoMan.addInstance(model);
        model.addStrand(strandInstance);
        model.addStrand(staple);
        for(var z = 0; z < vhelices.length;++z) {
            model.addVhelix(vhelices[z]);
            TheNanoMan.addInstance(vhelices[z]);
        }

        TheNanoMan.addInstance(strandInstance);
        TheNanoMan.addInstance(staple);

        TheNanoMan.addInstance(d1);
        TheNanoMan.addInstance(d1a);
        TheNanoMan.addInstance(d2);
        TheNanoMan.addInstance(d2a);
        TheNanoMan.addInstance(d3);
        TheNanoMan.addInstance(d4);



        var event = {
            type: Autodesk.Nano.MODEL_END_LOADED_EVENT,
            modelType : 'dna.origami',
            model : model
        };
        _viewer.fireEvent(event);


    }

    return {
        getViewer: getViewer,
        addModel: addModel,
        deleteModel: deleteModel,
        getModels: getModels,
        getModel: getModel,
        addInstance: addInstance,
        deleteInstance: deleteInstance,
        getInstances: getInstances,
        getInstancesById: getInstancesById,
        getInstancesByType: getInstancesByType,
        getInstance: getInstance,
        getSelectedInstances: getSelectedInstances,
        clearSelection: clearSelection,
        selectInstances : selectInstances,
        getViewer : getViewer,
        toggleSelection: toggleSelection,
        test4: test4,
        testSquare: testSquare,
        testLoader: testLoader,
        testNanoJSONObj: testNanoJSONObj,
        setUpFromJSON: setUpFromJSON
    };

};


/*
this.handleSingleClick = function(event, button) {
    var pointer = event.pointers ? event.pointers[ 0 ] : event;
    var result = intersectObjects(pointer, _sectionGroups[0].children);
    if (result) {
        attachControl(_transRotControl, result.object);
        _transRotControl.highlight();
        updateViewer();
    }

    return false;
};


var intersectObjects = (function () {
    var pointerVector = new THREE.Vector3();
    var pointerDir = new THREE.Vector3();
    var ray = new THREE.Raycaster();
    var camera = _viewer.camera;

    return function(pointer, objects, recursive) {
        var rect = _viewer.canvas.getBoundingClientRect();
        var x = ((pointer.clientX - rect.left) / rect.width) * 2 - 1;
        var y = - ((pointer.clientY - rect.top) / rect.height) * 2 + 1;

        if (camera.isPerspective) {
            pointerVector.set(x, y, 0.5);
            pointerVector.unproject(camera);
            ray.set(camera.position, pointerVector.sub(camera.position).normalize());
        } else {
            pointerVector.set(x, y, -1);
            pointerVector.unproject(camera);
            pointerDir.set(0, 0, -1);
            ray.set(pointerVector, pointerDir.transformDirection(camera.matrixWorld));
        }

        var intersections = ray.intersectObjects(objects, recursive);
        return intersections[0] ? intersections[0] : null;
    };
})();
    */

/*
function markObject(result) {
    TheMolMan.markObject(result);
}
function selectionIsEqual(dbNodeArray) {
    return TheMolMan.selectionIsEqual(dbNodeArray); //mz todo need to figure this out
}

function getSelectionLength = function () {
    return TheMolMan.numSelected();
}



// TODO: Optimize this so both select and toggleSelection don't have to lookup the node index.
function toggleSelection (result) {

    if (!result) {
        console.error("Attempting to select node 0.");
        return;
    }

    TheMolMan.toggleSelection(result);
    fireSelectionChangedEvent();
};

function getSelectionBounds() {
}
    */
;/**
 * @license BitSet.js v1.0.2 16/06/2014
 * http://www.xarg.org/2014/03/javascript-bit-array/
 *
 * Copyright (c) 2014, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/


/**
 * BitSet Class
 *
 * @param {number|String=} alloc The number of bits to use at max, or a bit-string to copy
 * @param {number=} value The default value for the bits
 * @constructor
 **/

window.BitSet = function BitSet(alloc, value) {

    if (alloc === undefined) {
        alloc = 31;
    } else if (typeof alloc === 'string') {
        alloc = alloc.length;
    }
    this.numAllocated = alloc;
    if (value !== 1) {
        value = 0;
    } else {
        value = 2147483647;
    }

    /**
     * @const
     * @type {number}
     */
    var size = 31;

    /**
     *
     * @type {number}
     */
    var length = Math.ceil(alloc / size);

    for (var i = length; i--;) {
        this[i] = value;
    }

    if (typeof alloc === 'string') {

        for (i = alloc.length; i--;) {
            this['set'](i, alloc.charAt(i));
        }
    }

    var transformRange = function(obj, from, to, mode) {

        // determine param type
        if (to === undefined) {

            if (from === undefined) {
                from = 0;
                to = length * size - 1;
            } else {
                to = from;
            }
        }

        // check range
        if (from < 0 || to < from || size * length <= to) {
            return null;
        }

        for (var i = length; i--;) {

            // determine local start and end
            var s = Math.max(from, i * size);
            var e = Math.min(to, size - 1 + size * i);

            if (s <= e) {

                /**
                 * @type {number}
                 Original derivated formula: ~(((1 << (e % size - s % size + 1)) - 1) << s % size)
                 Simplified: */
                var mask = ~ (1 << (1 + e % size)) + (1 << s % size);

                if (mode === 0) obj[i] &= mask;
                else
                    obj[i] ^= ~mask;
            }
        }
        return obj;
    };

    this['size'] = size * length;
    this['length'] = length;


    /**
     * Creates the bitwise AND of two sets. The result is stored in-place.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * bs1.and(bs2);
     *
     * @param {BitSet} obj A bitset object
     * @returns {BitSet} this
     */
    this['and'] = function(obj) {

        if (obj instanceof BitSet) {

            for (var i = length; i--;) {
                this[i] &= obj[i] || 0;
            }
        }
        return this;
    };


    /**
     * Creates the bitwise OR of two sets. The result is stored in-place.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * bs1.or(bs2);
     *
     * @param {BitSet} obj A bitset object
     * @returns {BitSet} this
     */
    this['or'] = function(obj) {

        if (obj instanceof BitSet) {

            for (var i = length; i--;) {
                this[i] |= obj[i] || 0;
            }
        }
        return this;
    };


    /**
     * Creates the bitwise NAND of two sets. The result is stored in-place.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * bs1.nand(bs2);
     *
     * @param {BitSet} obj A bitset object
     * @returns {BitSet} this
     */
    this['nand'] = function(obj) {

        if (obj instanceof BitSet) {

            for (var i = length; i--;) {
                this[i] = ~ (this[i] & (obj[i] || 0));
            }
        }
        return this;
    };


    /**
     * Creates the bitwise NOR of two sets. The result is stored in-place.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * bs1.or(bs2);
     *
     * @param {BitSet} obj A bitset object
     * @returns {BitSet} this
     */
    this['nor'] = function(obj) {

        if (obj instanceof BitSet) {

            for (var i = length; i--;) {
                this[i] = ~ (this[i] | (obj[i] || 0));
            }
        }
        return this;
    };


    /**
     * Creates the bitwise NOT of a set. The result is stored in-place.
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * bs1.not();
     *
     * @returns {BitSet} this
     */
    this['not'] = function() {

        for (var i = length; i--;) {
            this[i] = ~this[i];
        }
        return this;
    };

    /**
     * Creates the bitwise XOR of two sets. The result is stored in-place.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * bs1.xor(bs2);
     *
     * @param {BitSet} obj A bitset object
     * @returns {BitSet} this
     */
    this['xor'] = function(obj) {

        if (obj instanceof BitSet) {

            for (var i = length; i--;) {
                this[i] = (this[i] ^ (obj[i] || 0));
            }
        }
        return this;
    };


    /**
     * Compares two BitSet objects
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * bs1.equals(bs2) ? 'yes' : 'no'
     *
     * @param {BitSet} obj A bitset object
     * @returns {boolean} Whether the two BitSets are similar
     */
    this['equals'] = function(obj) {

        if (obj instanceof BitSet) {

            var max = obj;
            var min = this;

            if (length > obj.length) {
                max = this;
                min = obj;
            }

            for (var i = max.length; i--;) {

                if (i < min.length) {
                    if (max[i] !== min[i]) return false;
                } else if (max[i] !== 0) {
                    return false;
                }
            }

        } else {
            return false;
        }
        return true;
    };

    /**
     * Tests if one bitset is subset of another
     *
     * @param {BitSet} obj BitSet object to test against
     * @returns {boolean} true if
     */
    this['subsetOf'] = function(obj) {

        if (obj instanceof BitSet) {

            if (obj['length'] !== length) {
                return false;
            }

            for (var i = length; i--;) {
                if ((obj[i] & this[i]) !== this[i]) {
                    return false;
                }
            }

        } else {
            return false;
        }
        return true;
    };

    /**
     * Clones the actual object
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = bs1.clone();
     *
     * @returns {BitSet} A new BitSet object, containing a copy of the actual object
     */
    this['clone'] = function() {

        /**
         *
         * @type {BitSet}
         */
        var tmp = new BitSet(this['size']);

        for (var i = length; i--;) {
            tmp[i] = this[i];
        }
        return tmp;
    };

    /**
     * Check if the BitSet is empty, means all bits are unset
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * bs1.isEmpty() ? 'yes' : 'no'
     *
     * @returns {boolean} Whether the bitset is empty
     */
    this['isEmpty'] = function() {

        for (var i = length; i--;) {
            if (0 !== this[i]) return false;
        }
        return true;
    };

    this['toArray']  = function(){
        var list = [];
        var val;
        for(var i = 0; i< this.numAllocated;++i){
            val = this.get(i);
            list.push(val);
        }
        return list;
    };

    this['fromArray'] = function(list){
        var val;
        if(list.length === this.numAllocated){
            for(var i =0;i<list.length;++i){
                val = list[i] ? 1 :0;
                this.set(i,val);
            }
        }
    };

    /**
     * Overrides the toString method to get a binary representation of the BitSet
     *
     * @returns string A binary string
     */
    this['toStringRep'] = function() {

        var str = "";
        var tmp;
        for (var i = 0; i< length ;i++) {
            tmp = this[i].toString(36);
            str += tmp;

        }
        return str;
    };

    /**
     * Overrides the toString method to get a binary representation of the BitSet
     *
     * @returns string A binary string
     */
    this['toString'] = function(sep) {

        var str = "";
        for (var i = length; i--;) {

            if (i + 1 < length && sep !== undefined) str += String(sep);

            var tmp = this[i].toString(2);
            str += (new Array(1 + size - tmp['length']).join("0"));
            str += tmp;
        }
        return str;
    };

    /**
     * Calculates the number of bits set
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * var num = bs1.cardinality();
     *
     * @returns {number} The number of bits set
     */
    this['cardinality'] = function() {

        for (var n, num = 0, i = length; i--;) {

            for (n = this[i]; n; n &= n - 1, num++) {}
        }
        return num;
    };


    /**
     * Calculates the Most Significant Bit / log base two
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * var logbase2 = bs1.msb();
     *
     * var truncatedTwo = Math.pow(2, logbase2); // May overflow!
     *
     * @returns {number} The index of the highest bit set
     */
    this['msb'] = function() {

        for (var i = length; i--;) {

            var v = this[i];
            var c = 0;

            if (v) {

                for (;
                    (v >>= 1); c++) {

                }
                return size * i + c;
            }
        }
        return 0;
    };


    /**
     * Set a single bit flag
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * bs1.set(3, 1);
     *
     * @param {number} ndx The index of the bit to be set
     * @param {number=} value Optional value that should be set on the index (0 or 1)
     * @returns {BitSet} this
     */
    this['set'] = function(ndx, value) {

        if (ndx < 0) {
            return null;
        }

        if (value === undefined) {
            value = 1;
        }

        var slot = ndx / size;

        if (slot >= length) {

            // AUTO SCALE
            length = Math.ceil(slot);

            for (var i = this['length']; i < length; i++) {
                this[i] = 0;
            }

            this['size'] = size * length;
            this['length'] = length;
        }

        slot = Math.floor(slot);

        this[slot] ^= (1 << ndx % size) & (-(value & 1) ^ this[slot]);

        return this;

    };

    /**
     * Set a range of bits
     *
     * Ex:
     * bs1 = new BitSet();
     *
     * bs1.setRange(0, 5, "01011");
     * bs1.setRange(10, 15, 1);
     *
     * @param {number} from The start index of the range to be set
     * @param {number} to The end index of the range to be set
     * @param {number|String=} value Optional value that should be set on the index (0 or 1), or a bit string of the length of the window
     * @returns {BitSet} this
     */
    this['setRange'] = function(from, to, value) {

        if (from <= to && 0 <= from && to < size * length) {

            if (typeof value === "string") {

                // If window size is != string length, abort
                if (to - from !== value.length) {
                    return null;
                }

                for (var i = 0; i < value.length; i++) {
                    this['set'](i + from, value.charAt(value.length - i - 1));
                }

            } else {

                if (undefined === value) {
                    value = 1;
                }

                for (var i = from; i <= to; i++) {
                    this['set'](i, value);
                }
            }

            return this;
        }
        return null;
    };

    /**
     * Get a single bit flag of a certain bit position
     *
     * Ex:
     * bs1 = new BitSet();
     * var isValid = bs1.get(12);
     *
     * @param {number} ndx the index to be fetched
     * @returns {number|null} The binary flag
     */
    this['get'] = function(ndx) {

        if (0 <= ndx && ndx < size * length) {

            return (this[ndx / size | 0] >> (ndx % size)) & 1;
        }
        return null;
    };

    /**
     * Gets an entire range as a new bitset object
     *
     * Ex:
     * bs1 = new BitSet();
     * bs1.getRange(4, 8);
     *
     * @param {number} from The start index of the range to be get
     * @param {number} to The end index of the range to be get
     * @returns {BitSet} A new smaller bitset object, containing the extracted range
     */
    this['getRange'] = function(from, to) {

        if (from <= to && 0 <= from && to < size * length) {

            var tmp = new BitSet(to - from + 1);

            // Quite okay for a first naive implementation, needs improvement
            for (var i = from; i <= to; i++) {
                tmp['set'](i - from, this['get'](i));
            }
            return tmp;
        }
        return null;
    };

    /**
     * Clear a range of bits by setting it to 0
     *
     * Ex:
     * bs1 = new BitSet();
     * bs1.clear(); // Clear entire set
     * bs1.clear(5); // Clear single bit
     * bs1.clar(3,10); // Clear a bit range
     *
     * @param {number=} from The start index of the range to be cleared
     * @param {number=} to The end index of the range to be cleared
     * @returns {BitSet} this
     */
    this['clear'] = function(from, to) {

        return transformRange(this, from, to, 0);
    };

    /**
     * Flip/Invert a range of bits by setting
     *
     * Ex:
     * bs1 = new BitSet();
     * bs1.flip(); // Flip entire set
     * bs1.flip(5); // Flip single bit
     * bs1.flip(3,10); // Flip a bit range
     *
     * @param {number=} from The start index of the range to be flipped
     * @param {number=} to The end index of the range to be flipped
     * @returns {BitSet} this
     */
    this['flip'] = function(from, to) {

        return transformRange(this, from, to, 1);
    };
}
;/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2015-05-07.2
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			node.dispatchEvent(event);
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		// See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
		// https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
		// for the reasoning behind the timeout and revocation flow
		, arbitrary_revoke_timeout = 500 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			if (view.chrome) {
				revoker();
			} else {
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob(["\ufeff", blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name) {
			blob = auto_bom(blob);
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						var new_tab = view.open(object_url, "_blank");
						if (new_tab == undefined && typeof safari !== "undefined") {
							//Apple do not allow window.open, see http://bit.ly/1kZffRI
							view.location.href = object_url
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				save_link.href = object_url;
				save_link.download = name;
				click(save_link);
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				revoke(object_url);
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			// Update: Google errantly closed 91158, I submitted it again:
			// https://code.google.com/p/chromium/issues/detail?id=389642
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
									revoke(file);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name) {
			return navigator.msSaveOrOpenBlob(auto_bom(blob), name);
		};
	}

	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
  define('saveAs', [], function() {
    return saveAs;
  });
};
// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.4
var LZString144 = (function() {

// private property
    var f = String.fromCharCode;
    var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
    var baseReverseDic = {};

    function getBaseValue(alphabet, character) {
        if (!baseReverseDic[alphabet]) {
            baseReverseDic[alphabet] = {};
            for (var i=0 ; i<alphabet.length ; i++) {
                baseReverseDic[alphabet][alphabet.charAt(i)] = i;
            }
        }
        return baseReverseDic[alphabet][character];
    }

    var LZString144 = {
        compressToBase64 : function (input) {
            if (input == null) return "";
            var res = LZString144._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
            switch (res.length % 4) { // To produce valid Base64
                default: // When could this happen ?
                case 0 : return res;
                case 1 : return res+"===";
                case 2 : return res+"==";
                case 3 : return res+"=";
            }
        },

        decompressFromBase64 : function (input) {
            if (input == null) return "";
            if (input == "") return null;
            return LZString144._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
        },

        compressToUTF16 : function (input) {
            if (input == null) return "";
            return LZString144._compress(input, 15, function(a){return f(a+32);}) + " ";
        },

        decompressFromUTF16: function (compressed) {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return LZString144._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
        },

        //compress into uint8array (UCS-2 big endian format)
        compressToUint8Array: function (uncompressed) {
            var compressed = LZString144.compress(uncompressed);
            var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

            for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
                var current_value = compressed.charCodeAt(i);
                buf[i*2] = current_value >>> 8;
                buf[i*2+1] = current_value % 256;
            }
            return buf;
        },

        //decompress from uint8array (UCS-2 big endian format)
        decompressFromUint8Array:function (compressed) {
            if (compressed===null || compressed===undefined){
                return LZString144.decompress(compressed);
            } else {
                var buf=new Array(compressed.length/2); // 2 bytes per character
                for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
                    buf[i]=compressed[i*2]*256+compressed[i*2+1];
                }

                var result = [];
                buf.forEach(function (c) {
                    result.push(f(c));
                });
                return LZString144.decompress(result.join(''));

            }

        },


        //compress into a string that is already URI encoded
        compressToEncodedURIComponent: function (input) {
            if (input == null) return "";
            return LZString144._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
        },

        //decompress from an output of compressToEncodedURIComponent
        decompressFromEncodedURIComponent:function (input) {
            if (input == null) return "";
            if (input == "") return null;
            input = input.replace(/ /g, "+");
            return LZString144._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
        },

        compress: function (uncompressed) {
            return LZString144._compress(uncompressed, 16, function(a){return f(a);});
        },
        _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null) return "";
            var i, value,
                context_dictionary= {},
                context_dictionaryToCreate= {},
                context_c="",
                context_wc="",
                context_w="",
                context_enlargeIn= 2, // Compensate for the first entry which should not count
                context_dictSize= 3,
                context_numBits= 2,
                context_data=[],
                context_data_val=0,
                context_data_position=0,
                ii;

            for (ii = 0; ii < uncompressed.length; ii += 1) {
                context_c = uncompressed.charAt(ii);
                if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }

                context_wc = context_w + context_c;
                if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
                    context_w = context_wc;
                } else {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
                        if (context_w.charCodeAt(0)<256) {
                            for (i=0 ; i<context_numBits ; i++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar-1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                            }
                            value = context_w.charCodeAt(0);
                            for (i=0 ; i<8 ; i++) {
                                context_data_val = (context_data_val << 1) | (value&1);
                                if (context_data_position == bitsPerChar-1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        } else {
                            value = 1;
                            for (i=0 ; i<context_numBits ; i++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position ==bitsPerChar-1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i=0 ; i<16 ; i++) {
                                context_data_val = (context_data_val << 1) | (value&1);
                                if (context_data_position == bitsPerChar-1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    } else {
                        value = context_dictionary[context_w];
                        for (i=0 ; i<context_numBits ; i++) {
                            context_data_val = (context_data_val << 1) | (value&1);
                            if (context_data_position == bitsPerChar-1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }


                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    // Add wc to the dictionary.
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = String(context_c);
                }
            }

            // Output the code for w.
            if (context_w !== "") {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
                    if (context_w.charCodeAt(0)<256) {
                        for (i=0 ; i<context_numBits ; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar-1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                        }
                        value = context_w.charCodeAt(0);
                        for (i=0 ; i<8 ; i++) {
                            context_data_val = (context_data_val << 1) | (value&1);
                            if (context_data_position == bitsPerChar-1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    } else {
                        value = 1;
                        for (i=0 ; i<context_numBits ; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar-1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (i=0 ; i<16 ; i++) {
                            context_data_val = (context_data_val << 1) | (value&1);
                            if (context_data_position == bitsPerChar-1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    value = context_dictionary[context_w];
                    for (i=0 ; i<context_numBits ; i++) {
                        context_data_val = (context_data_val << 1) | (value&1);
                        if (context_data_position == bitsPerChar-1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }


                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
            }

            // Mark the end of the stream
            value = 2;
            for (i=0 ; i<context_numBits ; i++) {
                context_data_val = (context_data_val << 1) | (value&1);
                if (context_data_position == bitsPerChar-1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                } else {
                    context_data_position++;
                }
                value = value >> 1;
            }

            // Flush the last char
            while (true) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar-1) {
                    context_data.push(getCharFromInt(context_data_val));
                    break;
                }
                else context_data_position++;
            }
            return context_data.join('');
        },

        decompress: function (compressed) {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return LZString144._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
        },

        _decompress: function (length, resetValue, getNextValue) {
            var dictionary = [],
                next,
                enlargeIn = 4,
                dictSize = 4,
                numBits = 3,
                entry = "",
                result = [],
                i,
                w,
                bits, resb, maxpower, power,
                c,
                data = {val:getNextValue(0), position:resetValue, index:1};

            for (i = 0; i < 3; i += 1) {
                dictionary[i] = i;
            }

            bits = 0;
            maxpower = Math.pow(2,2);
            power=1;
            while (power!=maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb>0 ? 1 : 0) * power;
                power <<= 1;
            }

            switch (next = bits) {
                case 0:
                    bits = 0;
                    maxpower = Math.pow(2,8);
                    power=1;
                    while (power!=maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb>0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = f(bits);
                    break;
                case 1:
                    bits = 0;
                    maxpower = Math.pow(2,16);
                    power=1;
                    while (power!=maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb>0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = f(bits);
                    break;
                case 2:
                    return "";
            }
            dictionary[3] = c;
            w = c;
            result.push(c);
            while (true) {
                if (data.index > length) {
                    return "";
                }

                bits = 0;
                maxpower = Math.pow(2,numBits);
                power=1;
                while (power!=maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb>0 ? 1 : 0) * power;
                    power <<= 1;
                }

                switch (c = bits) {
                    case 0:
                        bits = 0;
                        maxpower = Math.pow(2,8);
                        power=1;
                        while (power!=maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb>0 ? 1 : 0) * power;
                            power <<= 1;
                        }

                        dictionary[dictSize++] = f(bits);
                        c = dictSize-1;
                        enlargeIn--;
                        break;
                    case 1:
                        bits = 0;
                        maxpower = Math.pow(2,16);
                        power=1;
                        while (power!=maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb>0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = f(bits);
                        c = dictSize-1;
                        enlargeIn--;
                        break;
                    case 2:
                        return result.join('');
                }

                if (enlargeIn == 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }

                if (dictionary[c]) {
                    entry = dictionary[c];
                } else {
                    if (c === dictSize) {
                        entry = w + w.charAt(0);
                    } else {
                        return null;
                    }
                }
                result.push(entry);

                // Add w+entry[0] to the dictionary.
                dictionary[dictSize++] = w + entry.charAt(0);
                enlargeIn--;

                w = entry;

                if (enlargeIn == 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }

            }
        }
    };
    return LZString144;
})();

if (typeof define === 'function' && define.amd) {
    define('LZString144', [], function () { return LZString144; });
} else if( typeof module !== 'undefined' && module != null ) {
    module.exports.LZString144 = LZString144;
}
;/*
 * js-md5 v0.3.0
 * https://github.com/emn178/js-md5
 *
 * Copyright 2014-2015, emn178@gmail.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
;
(function(root, undefined) {
    'use strict';

    var NODE_JS = typeof(module) != 'undefined';
    if (NODE_JS) {
        root = global;
        if (root.JS_MD5_TEST) {
            root.navigator = {
                userAgent: 'Firefox'
            };
        }
    }
    var FIREFOX = (root.JS_MD5_TEST || !NODE_JS) && navigator.userAgent.indexOf('Firefox') != -1;
    var ARRAY_BUFFER = !root.JS_MD5_TEST && typeof(ArrayBuffer) != 'undefined';
    var HEX_CHARS = '0123456789abcdef'.split('');
    var EXTRA = [128, 32768, 8388608, -2147483648];
    var SHIFT = [0, 8, 16, 24];

    var blocks = [],
        buffer8;
    if (ARRAY_BUFFER) {
        var buffer = new ArrayBuffer(68);
        buffer8 = new Uint8Array(buffer);
        blocks = new Uint32Array(buffer);
    }

    var md5 = function(message) {
        var notString = typeof(message) != 'string';
        if (notString && message.constructor == ArrayBuffer) {
            message = new Uint8Array(message);
        }

        var h0, h1, h2, h3, a, b, c, d, bc, da, code, first = true,
            end = false,
            index = 0,
            i, start = 0,
            bytes = 0,
            length = message.length;
        blocks[16] = 0;
        do {
            blocks[0] = blocks[16];
            blocks[16] = blocks[1] = blocks[2] = blocks[3] =
                blocks[4] = blocks[5] = blocks[6] = blocks[7] =
                    blocks[8] = blocks[9] = blocks[10] = blocks[11] =
                        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            if (notString) {
                if (ARRAY_BUFFER) {
                    for (i = start; index < length && i < 64; ++index) {
                        buffer8[i++] = message[index];
                    }
                } else {
                    for (i = start; index < length && i < 64; ++index) {
                        blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
                    }
                }
            } else {
                if (ARRAY_BUFFER) {
                    for (i = start; index < length && i < 64; ++index) {
                        code = message.charCodeAt(index);
                        if (code < 0x80) {
                            buffer8[i++] = code;
                        } else if (code < 0x800) {
                            buffer8[i++] = 0xc0 | (code >> 6);
                            buffer8[i++] = 0x80 | (code & 0x3f);
                        } else if (code < 0xd800 || code >= 0xe000) {
                            buffer8[i++] = 0xe0 | (code >> 12);
                            buffer8[i++] = 0x80 | ((code >> 6) & 0x3f);
                            buffer8[i++] = 0x80 | (code & 0x3f);
                        } else {
                            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
                            buffer8[i++] = 0xf0 | (code >> 18);
                            buffer8[i++] = 0x80 | ((code >> 12) & 0x3f);
                            buffer8[i++] = 0x80 | ((code >> 6) & 0x3f);
                            buffer8[i++] = 0x80 | (code & 0x3f);
                        }
                    }
                } else {
                    for (i = start; index < length && i < 64; ++index) {
                        code = message.charCodeAt(index);
                        if (code < 0x80) {
                            blocks[i >> 2] |= code << SHIFT[i++ & 3];
                        } else if (code < 0x800) {
                            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                        } else if (code < 0xd800 || code >= 0xe000) {
                            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                        } else {
                            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
                            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                        }
                    }
                }
            }
            bytes += i - start;
            start = i - 64;
            if (index == length) {
                blocks[i >> 2] |= EXTRA[i & 3];
                ++index;
            }
            if (index > length && i < 56) {
                blocks[14] = bytes << 3;
                end = true;
            }

            if (first) {
                a = blocks[0] - 680876937;
                a = (a << 7 | a >>> 25) - 271733879 << 0;
                d = (-1732584194 ^ a & 2004318071) + blocks[1] - 117830708;
                d = (d << 12 | d >>> 20) + a << 0;
                c = (-271733879 ^ (d & (a ^ -271733879))) + blocks[2] - 1126478375;
                c = (c << 17 | c >>> 15) + d << 0;
                b = (a ^ (c & (d ^ a))) + blocks[3] - 1316259209;
                b = (b << 22 | b >>> 10) + c << 0;
            } else {
                a = h0;
                b = h1;
                c = h2;
                d = h3;
                a += (d ^ (b & (c ^ d))) + blocks[0] - 680876936;
                a = (a << 7 | a >>> 25) + b << 0;
                d += (c ^ (a & (b ^ c))) + blocks[1] - 389564586;
                d = (d << 12 | d >>> 20) + a << 0;
                c += (b ^ (d & (a ^ b))) + blocks[2] + 606105819;
                c = (c << 17 | c >>> 15) + d << 0;
                b += (a ^ (c & (d ^ a))) + blocks[3] - 1044525330;
                b = (b << 22 | b >>> 10) + c << 0;
            }

            a += (d ^ (b & (c ^ d))) + blocks[4] - 176418897;
            a = (a << 7 | a >>> 25) + b << 0;
            d += (c ^ (a & (b ^ c))) + blocks[5] + 1200080426;
            d = (d << 12 | d >>> 20) + a << 0;
            c += (b ^ (d & (a ^ b))) + blocks[6] - 1473231341;
            c = (c << 17 | c >>> 15) + d << 0;
            b += (a ^ (c & (d ^ a))) + blocks[7] - 45705983;
            b = (b << 22 | b >>> 10) + c << 0;
            a += (d ^ (b & (c ^ d))) + blocks[8] + 1770035416;
            a = (a << 7 | a >>> 25) + b << 0;
            d += (c ^ (a & (b ^ c))) + blocks[9] - 1958414417;
            d = (d << 12 | d >>> 20) + a << 0;
            c += (b ^ (d & (a ^ b))) + blocks[10] - 42063;
            c = (c << 17 | c >>> 15) + d << 0;
            b += (a ^ (c & (d ^ a))) + blocks[11] - 1990404162;
            b = (b << 22 | b >>> 10) + c << 0;
            a += (d ^ (b & (c ^ d))) + blocks[12] + 1804603682;
            a = (a << 7 | a >>> 25) + b << 0;
            d += (c ^ (a & (b ^ c))) + blocks[13] - 40341101;
            d = (d << 12 | d >>> 20) + a << 0;
            c += (b ^ (d & (a ^ b))) + blocks[14] - 1502002290;
            c = (c << 17 | c >>> 15) + d << 0;
            b += (a ^ (c & (d ^ a))) + blocks[15] + 1236535329;
            b = (b << 22 | b >>> 10) + c << 0;
            a += (c ^ (d & (b ^ c))) + blocks[1] - 165796510;
            a = (a << 5 | a >>> 27) + b << 0;
            d += (b ^ (c & (a ^ b))) + blocks[6] - 1069501632;
            d = (d << 9 | d >>> 23) + a << 0;
            c += (a ^ (b & (d ^ a))) + blocks[11] + 643717713;
            c = (c << 14 | c >>> 18) + d << 0;
            b += (d ^ (a & (c ^ d))) + blocks[0] - 373897302;
            b = (b << 20 | b >>> 12) + c << 0;
            a += (c ^ (d & (b ^ c))) + blocks[5] - 701558691;
            a = (a << 5 | a >>> 27) + b << 0;
            d += (b ^ (c & (a ^ b))) + blocks[10] + 38016083;
            d = (d << 9 | d >>> 23) + a << 0;
            c += (a ^ (b & (d ^ a))) + blocks[15] - 660478335;
            c = (c << 14 | c >>> 18) + d << 0;
            b += (d ^ (a & (c ^ d))) + blocks[4] - 405537848;
            b = (b << 20 | b >>> 12) + c << 0;
            a += (c ^ (d & (b ^ c))) + blocks[9] + 568446438;
            a = (a << 5 | a >>> 27) + b << 0;
            d += (b ^ (c & (a ^ b))) + blocks[14] - 1019803690;
            d = (d << 9 | d >>> 23) + a << 0;
            c += (a ^ (b & (d ^ a))) + blocks[3] - 187363961;
            c = (c << 14 | c >>> 18) + d << 0;
            b += (d ^ (a & (c ^ d))) + blocks[8] + 1163531501;
            b = (b << 20 | b >>> 12) + c << 0;
            a += (c ^ (d & (b ^ c))) + blocks[13] - 1444681467;
            a = (a << 5 | a >>> 27) + b << 0;
            d += (b ^ (c & (a ^ b))) + blocks[2] - 51403784;
            d = (d << 9 | d >>> 23) + a << 0;
            c += (a ^ (b & (d ^ a))) + blocks[7] + 1735328473;
            c = (c << 14 | c >>> 18) + d << 0;
            b += (d ^ (a & (c ^ d))) + blocks[12] - 1926607734;
            b = (b << 20 | b >>> 12) + c << 0;
            bc = b ^ c;
            a += (bc ^ d) + blocks[5] - 378558;
            a = (a << 4 | a >>> 28) + b << 0;
            d += (bc ^ a) + blocks[8] - 2022574463;
            d = (d << 11 | d >>> 21) + a << 0;
            da = d ^ a;
            c += (da ^ b) + blocks[11] + 1839030562;
            c = (c << 16 | c >>> 16) + d << 0;
            b += (da ^ c) + blocks[14] - 35309556;
            b = (b << 23 | b >>> 9) + c << 0;
            bc = b ^ c;
            a += (bc ^ d) + blocks[1] - 1530992060;
            a = (a << 4 | a >>> 28) + b << 0;
            d += (bc ^ a) + blocks[4] + 1272893353;
            d = (d << 11 | d >>> 21) + a << 0;
            da = d ^ a;
            c += (da ^ b) + blocks[7] - 155497632;
            c = (c << 16 | c >>> 16) + d << 0;
            b += (da ^ c) + blocks[10] - 1094730640;
            b = (b << 23 | b >>> 9) + c << 0;
            bc = b ^ c;
            a += (bc ^ d) + blocks[13] + 681279174;
            a = (a << 4 | a >>> 28) + b << 0;
            d += (bc ^ a) + blocks[0] - 358537222;
            d = (d << 11 | d >>> 21) + a << 0;
            da = d ^ a;
            c += (da ^ b) + blocks[3] - 722521979;
            c = (c << 16 | c >>> 16) + d << 0;
            b += (da ^ c) + blocks[6] + 76029189;
            b = (b << 23 | b >>> 9) + c << 0;
            bc = b ^ c;
            a += (bc ^ d) + blocks[9] - 640364487;
            a = (a << 4 | a >>> 28) + b << 0;
            d += (bc ^ a) + blocks[12] - 421815835;
            d = (d << 11 | d >>> 21) + a << 0;
            da = d ^ a;
            c += (da ^ b) + blocks[15] + 530742520;
            c = (c << 16 | c >>> 16) + d << 0;
            b += (da ^ c) + blocks[2] - 995338651;
            b = (b << 23 | b >>> 9) + c << 0;
            a += (c ^ (b | ~d)) + blocks[0] - 198630844;
            a = (a << 6 | a >>> 26) + b << 0;
            d += (b ^ (a | ~c)) + blocks[7] + 1126891415;
            d = (d << 10 | d >>> 22) + a << 0;
            c += (a ^ (d | ~b)) + blocks[14] - 1416354905;
            c = (c << 15 | c >>> 17) + d << 0;
            b += (d ^ (c | ~a)) + blocks[5] - 57434055;
            b = (b << 21 | b >>> 11) + c << 0;
            a += (c ^ (b | ~d)) + blocks[12] + 1700485571;
            a = (a << 6 | a >>> 26) + b << 0;
            d += (b ^ (a | ~c)) + blocks[3] - 1894986606;
            d = (d << 10 | d >>> 22) + a << 0;
            c += (a ^ (d | ~b)) + blocks[10] - 1051523;
            c = (c << 15 | c >>> 17) + d << 0;
            b += (d ^ (c | ~a)) + blocks[1] - 2054922799;
            b = (b << 21 | b >>> 11) + c << 0;
            a += (c ^ (b | ~d)) + blocks[8] + 1873313359;
            a = (a << 6 | a >>> 26) + b << 0;
            d += (b ^ (a | ~c)) + blocks[15] - 30611744;
            d = (d << 10 | d >>> 22) + a << 0;
            c += (a ^ (d | ~b)) + blocks[6] - 1560198380;
            c = (c << 15 | c >>> 17) + d << 0;
            b += (d ^ (c | ~a)) + blocks[13] + 1309151649;
            b = (b << 21 | b >>> 11) + c << 0;
            a += (c ^ (b | ~d)) + blocks[4] - 145523070;
            a = (a << 6 | a >>> 26) + b << 0;
            d += (b ^ (a | ~c)) + blocks[11] - 1120210379;
            d = (d << 10 | d >>> 22) + a << 0;
            c += (a ^ (d | ~b)) + blocks[2] + 718787259;
            c = (c << 15 | c >>> 17) + d << 0;
            b += (d ^ (c | ~a)) + blocks[9] - 343485551;
            b = (b << 21 | b >>> 11) + c << 0;

            if (first) {
                h0 = a + 1732584193 << 0;
                h1 = b - 271733879 << 0;
                h2 = c - 1732584194 << 0;
                h3 = d + 271733878 << 0;
                first = false;
            } else {
                h0 = h0 + a << 0;
                h1 = h1 + b << 0;
                h2 = h2 + c << 0;
                h3 = h3 + d << 0;
            }
        } while (!end);

        if (FIREFOX) {
            var hex = HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F];
            hex += HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F];
            hex += HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F];
            hex += HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F];
            hex += HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F];
            hex += HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F];
            hex += HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F];
            hex += HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F];
            hex += HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F];
            hex += HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F];
            hex += HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F];
            hex += HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F];
            hex += HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F];
            hex += HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F];
            hex += HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F];
            hex += HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F];
            return hex;
        } else {
            return HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] + HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] + HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] + HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] + HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] + HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] + HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] + HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] + HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] + HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] + HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] + HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] + HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] + HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] + HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] + HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F];
        }
    };

    if (!root.JS_MD5_TEST && NODE_JS) {
        var crypto = require('crypto');
        var Buffer = require('buffer').Buffer;

        module.exports.md5 = function(message) {
            if (typeof(message) == 'string') {
                if (message.length <= 80) {
                    return md5(message);
                } else if (message.length <= 183 && !/[^\x00-\x7F]/.test(message)) {
                    return md5(message);
                }
                return crypto.createHash('md5').update(message, 'utf8').digest('hex');
            }
            if (message.constructor == ArrayBuffer) {
                message = new Uint8Array(message);
            }
            if (message.length <= 370) {
                return md5(message);
            }
            return crypto.createHash('md5').update(new Buffer(message)).digest('hex');
        };
    } else if (root) {
        root.md5 = md5;
    }
}(window));
;/*! nouislider - 8.2.1 - 2015-12-02 21:43:14 */

!function(a){"function"==typeof define&&define.amd?define('noUiSlider',[],a):"object"==typeof exports?module.exports.noUiSlider=a():window.noUiSlider=a()}(function(){"use strict";function a(a){return a.filter(function(a){return this[a]?!1:this[a]=!0},{})}function b(a,b){return Math.round(a/b)*b}function c(a){var b=a.getBoundingClientRect(),c=a.ownerDocument,d=c.documentElement,e=m();return/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)&&(e.x=0),{top:b.top+e.y-d.clientTop,left:b.left+e.x-d.clientLeft}}function d(a){return"number"==typeof a&&!isNaN(a)&&isFinite(a)}function e(a){var b=Math.pow(10,7);return Number((Math.round(a*b)/b).toFixed(7))}function f(a,b,c){j(a,b),setTimeout(function(){k(a,b)},c)}function g(a){return Math.max(Math.min(a,100),0)}function h(a){return Array.isArray(a)?a:[a]}function i(a){var b=a.split(".");return b.length>1?b[1].length:0}function j(a,b){a.classList?a.classList.add(b):a.className+=" "+b}function k(a,b){a.classList?a.classList.remove(b):a.className=a.className.replace(new RegExp("(^|\\b)"+b.split(" ").join("|")+"(\\b|$)","gi")," ")}function l(a,b){a.classList?a.classList.contains(b):new RegExp("(^| )"+b+"( |$)","gi").test(a.className)}function m(){var a=void 0!==window.pageXOffset,b="CSS1Compat"===(document.compatMode||""),c=a?window.pageXOffset:b?document.documentElement.scrollLeft:document.body.scrollLeft,d=a?window.pageYOffset:b?document.documentElement.scrollTop:document.body.scrollTop;return{x:c,y:d}}function n(a){a.stopPropagation()}function o(a){return function(b){return a+b}}function p(a,b){return 100/(b-a)}function q(a,b){return 100*b/(a[1]-a[0])}function r(a,b){return q(a,a[0]<0?b+Math.abs(a[0]):b-a[0])}function s(a,b){return b*(a[1]-a[0])/100+a[0]}function t(a,b){for(var c=1;a>=b[c];)c+=1;return c}function u(a,b,c){if(c>=a.slice(-1)[0])return 100;var d,e,f,g,h=t(c,a);return d=a[h-1],e=a[h],f=b[h-1],g=b[h],f+r([d,e],c)/p(f,g)}function v(a,b,c){if(c>=100)return a.slice(-1)[0];var d,e,f,g,h=t(c,b);return d=a[h-1],e=a[h],f=b[h-1],g=b[h],s([d,e],(c-f)*p(f,g))}function w(a,c,d,e){if(100===e)return e;var f,g,h=t(e,a);return d?(f=a[h-1],g=a[h],e-f>(g-f)/2?g:f):c[h-1]?a[h-1]+b(e-a[h-1],c[h-1]):e}function x(a,b,c){var e;if("number"==typeof b&&(b=[b]),"[object Array]"!==Object.prototype.toString.call(b))throw new Error("noUiSlider: 'range' contains invalid value.");if(e="min"===a?0:"max"===a?100:parseFloat(a),!d(e)||!d(b[0]))throw new Error("noUiSlider: 'range' value isn't numeric.");c.xPct.push(e),c.xVal.push(b[0]),e?c.xSteps.push(isNaN(b[1])?!1:b[1]):isNaN(b[1])||(c.xSteps[0]=b[1])}function y(a,b,c){return b?void(c.xSteps[a]=q([c.xVal[a],c.xVal[a+1]],b)/p(c.xPct[a],c.xPct[a+1])):!0}function z(a,b,c,d){this.xPct=[],this.xVal=[],this.xSteps=[d||!1],this.xNumSteps=[!1],this.snap=b,this.direction=c;var e,f=[];for(e in a)a.hasOwnProperty(e)&&f.push([a[e],e]);for(f.length&&"object"==typeof f[0][0]?f.sort(function(a,b){return a[0][0]-b[0][0]}):f.sort(function(a,b){return a[0]-b[0]}),e=0;e<f.length;e++)x(f[e][1],f[e][0],this);for(this.xNumSteps=this.xSteps.slice(0),e=0;e<this.xNumSteps.length;e++)y(e,this.xNumSteps[e],this)}function A(a,b){if(!d(b))throw new Error("noUiSlider: 'step' is not numeric.");a.singleStep=b}function B(a,b){if("object"!=typeof b||Array.isArray(b))throw new Error("noUiSlider: 'range' is not an object.");if(void 0===b.min||void 0===b.max)throw new Error("noUiSlider: Missing 'min' or 'max' in 'range'.");if(b.min===b.max)throw new Error("noUiSlider: 'range' 'min' and 'max' cannot be equal.");a.spectrum=new z(b,a.snap,a.dir,a.singleStep)}function C(a,b){if(b=h(b),!Array.isArray(b)||!b.length||b.length>2)throw new Error("noUiSlider: 'start' option is incorrect.");a.handles=b.length,a.start=b}function D(a,b){if(a.snap=b,"boolean"!=typeof b)throw new Error("noUiSlider: 'snap' option must be a boolean.")}function E(a,b){if(a.animate=b,"boolean"!=typeof b)throw new Error("noUiSlider: 'animate' option must be a boolean.")}function F(a,b){if("lower"===b&&1===a.handles)a.connect=1;else if("upper"===b&&1===a.handles)a.connect=2;else if(b===!0&&2===a.handles)a.connect=3;else{if(b!==!1)throw new Error("noUiSlider: 'connect' option doesn't match handle count.");a.connect=0}}function G(a,b){switch(b){case"horizontal":a.ort=0;break;case"vertical":a.ort=1;break;default:throw new Error("noUiSlider: 'orientation' option is invalid.")}}function H(a,b){if(!d(b))throw new Error("noUiSlider: 'margin' option must be numeric.");if(a.margin=a.spectrum.getMargin(b),!a.margin)throw new Error("noUiSlider: 'margin' option is only supported on linear sliders.")}function I(a,b){if(!d(b))throw new Error("noUiSlider: 'limit' option must be numeric.");if(a.limit=a.spectrum.getMargin(b),!a.limit)throw new Error("noUiSlider: 'limit' option is only supported on linear sliders.")}function J(a,b){switch(b){case"ltr":a.dir=0;break;case"rtl":a.dir=1,a.connect=[0,2,1,3][a.connect];break;default:throw new Error("noUiSlider: 'direction' option was not recognized.")}}function K(a,b){if("string"!=typeof b)throw new Error("noUiSlider: 'behaviour' must be a string containing options.");var c=b.indexOf("tap")>=0,d=b.indexOf("drag")>=0,e=b.indexOf("fixed")>=0,f=b.indexOf("snap")>=0,g=b.indexOf("hover")>=0;if(d&&!a.connect)throw new Error("noUiSlider: 'drag' behaviour must be used with 'connect': true.");a.events={tap:c||f,drag:d,fixed:e,snap:f,hover:g}}function L(a,b){var c;if(b!==!1)if(b===!0)for(a.tooltips=[],c=0;c<a.handles;c++)a.tooltips.push(!0);else{if(a.tooltips=h(b),a.tooltips.length!==a.handles)throw new Error("noUiSlider: must pass a formatter for all handles.");a.tooltips.forEach(function(a){if("boolean"!=typeof a&&("object"!=typeof a||"function"!=typeof a.to))throw new Error("noUiSlider: 'tooltips' must be passed a formatter or 'false'.")})}}function M(a,b){if(a.format=b,"function"==typeof b.to&&"function"==typeof b.from)return!0;throw new Error("noUiSlider: 'format' requires 'to' and 'from' methods.")}function N(a,b){if(void 0!==b&&"string"!=typeof b)throw new Error("noUiSlider: 'cssPrefix' must be a string.");a.cssPrefix=b}function O(a){var b,c={margin:0,limit:0,animate:!0,format:T};b={step:{r:!1,t:A},start:{r:!0,t:C},connect:{r:!0,t:F},direction:{r:!0,t:J},snap:{r:!1,t:D},animate:{r:!1,t:E},range:{r:!0,t:B},orientation:{r:!1,t:G},margin:{r:!1,t:H},limit:{r:!1,t:I},behaviour:{r:!0,t:K},format:{r:!1,t:M},tooltips:{r:!1,t:L},cssPrefix:{r:!1,t:N}};var d={connect:!1,direction:"ltr",behaviour:"tap",orientation:"horizontal"};return Object.keys(b).forEach(function(e){if(void 0===a[e]&&void 0===d[e]){if(b[e].r)throw new Error("noUiSlider: '"+e+"' is required.");return!0}b[e].t(c,void 0===a[e]?d[e]:a[e])}),c.pips=a.pips,c.style=c.ort?"top":"left",c}function P(b,d){function e(a,b,c){var d=a+b[0],e=a+b[1];return c?(0>d&&(e+=Math.abs(d)),e>100&&(d-=e-100),[g(d),g(e)]):[d,e]}function p(a,b){a.preventDefault();var c,d,e=0===a.type.indexOf("touch"),f=0===a.type.indexOf("mouse"),g=0===a.type.indexOf("pointer"),h=a;return 0===a.type.indexOf("MSPointer")&&(g=!0),e&&(c=a.changedTouches[0].pageX,d=a.changedTouches[0].pageY),b=b||m(),(f||g)&&(c=a.clientX+b.x,d=a.clientY+b.y),h.pageOffset=b,h.points=[c,d],h.cursor=f||g,h}function q(a,b){var c=document.createElement("div"),d=document.createElement("div"),e=["-lower","-upper"];return a&&e.reverse(),j(d,da[3]),j(d,da[3]+e[b]),j(c,da[2]),c.appendChild(d),c}function r(a,b,c){switch(a){case 1:j(b,da[7]),j(c[0],da[6]);break;case 3:j(c[1],da[6]);case 2:j(c[0],da[7]);case 0:j(b,da[6])}}function s(a,b,c){var d,e=[];for(d=0;a>d;d+=1)e.push(c.appendChild(q(b,d)));return e}function t(a,b,c){j(c,da[0]),j(c,da[8+a]),j(c,da[4+b]);var d=document.createElement("div");return j(d,da[1]),c.appendChild(d),d}function u(a,b){if(!d.tooltips[b])return!1;var c=document.createElement("div");return c.className=da[18],a.firstChild.appendChild(c)}function v(){d.dir&&d.tooltips.reverse();var a=Y.map(u);d.dir&&(a.reverse(),d.tooltips.reverse()),U("update",function(b,c,e){a[c]&&(a[c].innerHTML=d.tooltips[c]===!0?b[c]:d.tooltips[c].to(e[c]))})}function w(a,b,c){if("range"===a||"steps"===a)return aa.xVal;if("count"===a){var d,e=100/(b-1),f=0;for(b=[];(d=f++*e)<=100;)b.push(d);a="positions"}return"positions"===a?b.map(function(a){return aa.fromStepping(c?aa.getStep(a):a)}):"values"===a?c?b.map(function(a){return aa.fromStepping(aa.getStep(aa.toStepping(a)))}):b:void 0}function x(b,c,d){function e(a,b){return(a+b).toFixed(7)/1}var f=aa.direction,g={},h=aa.xVal[0],i=aa.xVal[aa.xVal.length-1],j=!1,k=!1,l=0;return aa.direction=0,d=a(d.slice().sort(function(a,b){return a-b})),d[0]!==h&&(d.unshift(h),j=!0),d[d.length-1]!==i&&(d.push(i),k=!0),d.forEach(function(a,f){var h,i,m,n,o,p,q,r,s,t,u=a,v=d[f+1];if("steps"===c&&(h=aa.xNumSteps[f]),h||(h=v-u),u!==!1&&void 0!==v)for(i=u;v>=i;i=e(i,h)){for(n=aa.toStepping(i),o=n-l,r=o/b,s=Math.round(r),t=o/s,m=1;s>=m;m+=1)p=l+m*t,g[p.toFixed(5)]=["x",0];q=d.indexOf(i)>-1?1:"steps"===c?2:0,!f&&j&&(q=0),i===v&&k||(g[n.toFixed(5)]=[i,q]),l=n}}),aa.direction=f,g}function y(a,b,c){function e(a){return["-normal","-large","-sub"][a]}function f(a,b,c){return'class="'+b+" "+b+"-"+h+" "+b+e(c[1])+'" style="'+d.style+": "+a+'%"'}function g(a,d){aa.direction&&(a=100-a),d[1]=d[1]&&b?b(d[0],d[1]):d[1],i.innerHTML+="<div "+f(a,da[21],d)+"></div>",d[1]&&(i.innerHTML+="<div "+f(a,da[22],d)+">"+c.to(d[0])+"</div>")}var h=["horizontal","vertical"][d.ort],i=document.createElement("div");return j(i,da[20]),j(i,da[20]+"-"+h),Object.keys(a).forEach(function(b){g(b,a[b])}),i}function z(a){var b=a.mode,c=a.density||1,d=a.filter||!1,e=a.values||!1,f=a.stepped||!1,g=w(b,e,f),h=x(c,b,g),i=a.format||{to:Math.round};return $.appendChild(y(h,d,i))}function A(){return X["offset"+["Width","Height"][d.ort]]}function B(a,b,c){void 0!==b&&1!==d.handles&&(b=Math.abs(b-d.dir)),Object.keys(ca).forEach(function(d){var e=d.split(".")[0];a===e&&ca[d].forEach(function(a){a.call(Z,h(P()),b,h(C(Array.prototype.slice.call(ba))),c||!1)})})}function C(a){return 1===a.length?a[0]:d.dir?a.reverse():a}function D(a,b,c,e){var f=function(b){return $.hasAttribute("disabled")?!1:l($,da[14])?!1:(b=p(b,e.pageOffset),a===R.start&&void 0!==b.buttons&&b.buttons>1?!1:e.hover&&b.buttons?!1:(b.calcPoint=b.points[d.ort],void c(b,e)))},g=[];return a.split(" ").forEach(function(a){b.addEventListener(a,f,!1),g.push([a,f])}),g}function E(a,b){if(-1===navigator.appVersion.indexOf("MSIE 9")&&0===a.buttons&&0!==b.buttonsProperty)return F(a,b);var c,d,f=b.handles||Y,g=!1,h=100*(a.calcPoint-b.start)/b.baseSize,i=f[0]===Y[0]?0:1;if(c=e(h,b.positions,f.length>1),g=L(f[0],c[i],1===f.length),f.length>1){if(g=L(f[1],c[i?0:1],!1)||g)for(d=0;d<b.handles.length;d++)B("slide",d)}else g&&B("slide",i)}function F(a,b){var c=X.querySelector("."+da[15]),d=b.handles[0]===Y[0]?0:1;null!==c&&k(c,da[15]),a.cursor&&(document.body.style.cursor="",document.body.removeEventListener("selectstart",document.body.noUiListener));var e=document.documentElement;e.noUiListeners.forEach(function(a){e.removeEventListener(a[0],a[1])}),k($,da[12]),B("set",d),B("change",d),void 0!==b.handleNumber&&B("end",b.handleNumber)}function G(a,b){"mouseout"===a.type&&"HTML"===a.target.nodeName&&null===a.relatedTarget&&F(a,b)}function H(a,b){var c=document.documentElement;if(1===b.handles.length&&(j(b.handles[0].children[0],da[15]),b.handles[0].hasAttribute("disabled")))return!1;a.preventDefault(),a.stopPropagation();var d=D(R.move,c,E,{start:a.calcPoint,baseSize:A(),pageOffset:a.pageOffset,handles:b.handles,handleNumber:b.handleNumber,buttonsProperty:a.buttons,positions:[_[0],_[Y.length-1]]}),e=D(R.end,c,F,{handles:b.handles,handleNumber:b.handleNumber}),f=D("mouseout",c,G,{handles:b.handles,handleNumber:b.handleNumber});if(c.noUiListeners=d.concat(e,f),a.cursor){document.body.style.cursor=getComputedStyle(a.target).cursor,Y.length>1&&j($,da[12]);var g=function(){return!1};document.body.noUiListener=g,document.body.addEventListener("selectstart",g,!1)}void 0!==b.handleNumber&&B("start",b.handleNumber)}function I(a){var b,e,g=a.calcPoint,h=0;return a.stopPropagation(),Y.forEach(function(a){h+=c(a)[d.style]}),b=h/2>g||1===Y.length?0:1,g-=c(X)[d.style],e=100*g/A(),d.events.snap||f($,da[14],300),Y[b].hasAttribute("disabled")?!1:(L(Y[b],e),B("slide",b,!0),B("set",b,!0),B("change",b,!0),void(d.events.snap&&H(a,{handles:[Y[b]]})))}function J(a){var b=a.calcPoint-c(X)[d.style],e=aa.getStep(100*b/A()),f=aa.fromStepping(e);Object.keys(ca).forEach(function(a){"hover"===a.split(".")[0]&&ca[a].forEach(function(a){a.call(Z,f)})})}function K(a){var b,c;if(!a.fixed)for(b=0;b<Y.length;b+=1)D(R.start,Y[b].children[0],H,{handles:[Y[b]],handleNumber:b});if(a.tap&&D(R.start,X,I,{handles:Y}),a.hover)for(D(R.move,X,J,{hover:!0}),b=0;b<Y.length;b+=1)["mousemove MSPointerMove pointermove"].forEach(function(a){Y[b].children[0].addEventListener(a,n,!1)});a.drag&&(c=[X.querySelector("."+da[7])],j(c[0],da[10]),a.fixed&&c.push(Y[c[0]===Y[0]?1:0].children[0]),c.forEach(function(a){D(R.start,a,H,{handles:Y})}))}function L(a,b,c){var e=a!==Y[0]?1:0,f=_[0]+d.margin,h=_[1]-d.margin,i=_[0]+d.limit,l=_[1]-d.limit;return Y.length>1&&(b=e?Math.max(b,f):Math.min(b,h)),c!==!1&&d.limit&&Y.length>1&&(b=e?Math.min(b,i):Math.max(b,l)),b=aa.getStep(b),b=g(parseFloat(b.toFixed(7))),b===_[e]?!1:(window.requestAnimationFrame?window.requestAnimationFrame(function(){a.style[d.style]=b+"%"}):a.style[d.style]=b+"%",a.previousSibling||(k(a,da[17]),b>50&&j(a,da[17])),_[e]=b,ba[e]=aa.fromStepping(b),B("update",e),!0)}function M(a,b){var c,e,f;for(d.limit&&(a+=1),c=0;a>c;c+=1)e=c%2,f=b[e],null!==f&&f!==!1&&("number"==typeof f&&(f=String(f)),f=d.format.from(f),(f===!1||isNaN(f)||L(Y[e],aa.toStepping(f),c===3-d.dir)===!1)&&B("update",e))}function N(a){var b,c,e=h(a);for(d.dir&&d.handles>1&&e.reverse(),d.animate&&-1!==_[0]&&f($,da[14],300),b=Y.length>1?3:1,1===e.length&&(b=1),M(b,e),c=0;c<Y.length;c++)B("set",c)}function P(){var a,b=[];for(a=0;a<d.handles;a+=1)b[a]=d.format.to(ba[a]);return C(b)}function Q(){da.forEach(function(a){a&&k($,a)}),$.innerHTML="",delete $.noUiSlider}function T(){var a=_.map(function(a,b){var c=aa.getApplicableStep(a),d=i(String(c[2])),e=ba[b],f=100===a?null:c[2],g=Number((e-c[2]).toFixed(d)),h=0===a?null:g>=c[1]?c[2]:c[0]||!1;return[h,f]});return C(a)}function U(a,b){ca[a]=ca[a]||[],ca[a].push(b),"update"===a.split(".")[0]&&Y.forEach(function(a,b){B("update",b)})}function V(a){var b=a.split(".")[0],c=a.substring(b.length);Object.keys(ca).forEach(function(a){var d=a.split(".")[0],e=a.substring(d.length);b&&b!==d||c&&c!==e||delete ca[a]})}function W(a){var b,c=P(),e=O({start:[0,0],margin:a.margin,limit:a.limit,step:a.step,range:a.range,animate:a.animate,snap:void 0===a.snap?d.snap:a.snap});for(["margin","limit","step","range","animate"].forEach(function(b){void 0!==a[b]&&(d[b]=a[b])}),aa=e.spectrum,_=[-1,-1],N(c),b=0;b<Y.length;b++)B("update",b)}var X,Y,Z,$=b,_=[-1,-1],aa=d.spectrum,ba=[],ca={},da=["target","base","origin","handle","horizontal","vertical","background","connect","ltr","rtl","draggable","","state-drag","","state-tap","active","","stacking","tooltip","","pips","marker","value"].map(o(d.cssPrefix||S));if($.noUiSlider)throw new Error("Slider was already initialized.");return X=t(d.dir,d.ort,$),Y=s(d.handles,d.dir,X),r(d.connect,$,Y),d.pips&&z(d.pips),d.tooltips&&v(),Z={destroy:Q,steps:T,on:U,off:V,get:P,set:N,updateOptions:W},K(d.events),Z}function Q(a,b){if(!a.nodeName)throw new Error("noUiSlider.create requires a single element.");var c=O(b,a),d=P(a,c);return d.set(c.start),a.noUiSlider=d,d}var R=window.navigator.pointerEnabled?{start:"pointerdown",move:"pointermove",end:"pointerup"}:window.navigator.msPointerEnabled?{start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}:{start:"mousedown touchstart",move:"mousemove touchmove",end:"mouseup touchend"},S="noUi-";z.prototype.getMargin=function(a){return 2===this.xPct.length?q(this.xVal,a):!1},z.prototype.toStepping=function(a){return a=u(this.xVal,this.xPct,a),this.direction&&(a=100-a),a},z.prototype.fromStepping=function(a){return this.direction&&(a=100-a),e(v(this.xVal,this.xPct,a))},z.prototype.getStep=function(a){return this.direction&&(a=100-a),a=w(this.xPct,this.xSteps,this.snap,a),this.direction&&(a=100-a),a},z.prototype.getApplicableStep=function(a){var b=t(a,this.xPct),c=100===a?2:1;return[this.xNumSteps[b-2],this.xVal[b-c],this.xNumSteps[b-c]]},z.prototype.convert=function(a){return this.getStep(this.toStepping(a))};var T={to:function(a){return void 0!==a&&a.toFixed(2)},from:Number};return{create:Q}});;//from https://github.com/sloosch/rle
(function() {
    var RLE = {};
    /**
     * Encodes the given stream of binary data by run length
     * The maximum run length is "limited" to 2^28.
     * This function further packs the data to reduce the memory usage by nominal 1/4 of the simple RLE approach.
     * @param {Array<*>} stream
     * array of binary data. "truthy" values will be treated as 1
     * @returns {Uint32Array}
     * array of 32 bit chunks representing the encoded data
     */
    RLE.encode = function (stream) {
        var out = [0];
        var oidx = 0;
        var mcu = 0;
        var midx = 0;
        var symbol = false;
        for (var i = 0; i <= stream.length; i++) {
            if (i < stream.length && !!stream[i] === symbol) {
                mcu++;
            } else {
                for (var s = 0; s < 4; s++) {
                    var k = (mcu >> (s * 7)) & 0x7f;
                    out[oidx] |= k << (midx * 7 + 4);
                    if (++midx === 4) {
                        oidx++;
                        out[oidx] = 0;
                        midx = 0;
                    }
                    //overflow?
                    if (!(mcu > (1 << 7 * (s + 1)) - 1)) {
                        break;
                    } else {
                        out[oidx] |= 1 << midx;
                    }
                }
                mcu = 1;
                symbol = !symbol;
            }
        }
        return new Uint32Array(out);
    };

    /**
     * Decodes the stream of RLE data to a binary stream
     * @param {Uint32Array} stream
     * encoded stream of RLE encoded data
     * @returns {Array<boolean>}
     * binary representation of the data
     */
    RLE.decode = function (stream) {
        var out = [];
        var mcu = 0;
        var symbol = true;
        var midx = 0;
        var oidx = 0;
        for (var i = 0; i < stream.length; i++) {
            for (var s = 0; s < 4; s++) {
                var overflow = stream[i] & (1 << s);
                if (!overflow) {
                    while (--mcu >= 0) {
                        out[oidx] = symbol;
                        oidx++;
                    }
                    mcu = 0;
                    symbol = !symbol;
                    midx = 0;
                } else {
                    midx++;
                    if (midx === 4) {
                        throw new Error('Corrupted data.');
                    }
                }
                var k = (stream[i] >> (s * 7 + 4)) & 0x7f;
                mcu |= k << (7 * midx);
            }
        }
        while (--mcu >= 0) {
            out[oidx] = symbol;
            oidx++;
        }
        return out;
    };

    /**
     * Encodes the given data by run length using the simple approach.
     * @param {Array<*>}stream
     * array of binary data. "truthy" values will be treated as 1
     * @returns {Array<number>}
     * array of alternating run lengths. Zero first.
     */
    RLE.encodeSimple = function(stream) {
        var out = [0];
        var oidx = 0;
        var symbol = false;
        for(var i = 0; i < stream.length; i++) {
            if(!!stream[i] === symbol) {
                out[oidx]++;
            } else {
                symbol = !symbol;
                oidx++;
                out[oidx] = 1;
            }
        }
        return out;
    };

    /**
     * Decodes the simple RLE stream.
     * @param {Array<number>} stream
     * stream of simple RLE data.
     * @returns {Array<boolean>}
     * binary representation of the data
     */
    RLE.decodeSimple = function(stream) {
        var out = [];
        var symbol = false;
        for(var i = 0; i < stream.length; i++) {
            for(var s = 0; s < stream[i]; s++) {
                out.push(symbol);
            }
            symbol = !symbol;
        }
        return out;
    };

    if('undefined' !== typeof module) {
        module.exports.RLE = RLE;
    } else {
        window.RLE = RLE;
    }
}());


;/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @license MIT
 */


(function (factory) {
    "use strict";

    if (typeof define === "function" && define.amd) {
        define('Sortable', [], factory);
    }
    else if (typeof module != "undefined" && typeof module.exports != "undefined") {
        module.exports.Sortable = factory();
    }
    else if (typeof Package !== "undefined") {
        Sortable = factory();  // export for Meteor.js
    }
    else {
        /* jshint sub:true */
        window["Sortable"] = factory();
    }

})(function () {
    "use strict";

    if (typeof window == "undefined" || typeof window.document == "undefined") {
        return function() {
            throw new Error( "Sortable.js requires a window with a document" );
        }
    }

    var dragEl,
        parentEl,
        ghostEl,
        cloneEl,
        rootEl,
        nextEl,

        scrollEl,
        scrollParentEl,

        lastEl,
        lastCSS,
        lastParentCSS,

        oldIndex,
        newIndex,

        activeGroup,
        autoScroll = {},

        tapEvt,
        touchEvt,

        moved,

        /** @const */
        RSPACE = /\s+/g,

        expando = 'Sortable' + (new Date).getTime(),

        win = window,
        document = win.document,
        parseInt = win.parseInt,

        supportDraggable = !!('draggable' in document.createElement('div')),
        supportCssPointerEvents = (function (el) {
            el = document.createElement('x');
            el.style.cssText = 'pointer-events:auto';
            return el.style.pointerEvents === 'auto';
        })(),

        _silent = false,

        abs = Math.abs,
        slice = [].slice,

        touchDragOverListeners = [],

        _autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl) {
            // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
            if (rootEl && options.scroll) {
                var el,
                    rect,
                    sens = options.scrollSensitivity,
                    speed = options.scrollSpeed,

                    x = evt.clientX,
                    y = evt.clientY,

                    winWidth = window.innerWidth,
                    winHeight = window.innerHeight,

                    vx,
                    vy
                    ;

                // Delect scrollEl
                if (scrollParentEl !== rootEl) {
                    scrollEl = options.scroll;
                    scrollParentEl = rootEl;

                    if (scrollEl === true) {
                        scrollEl = rootEl;

                        do {
                            if ((scrollEl.offsetWidth < scrollEl.scrollWidth) ||
                                (scrollEl.offsetHeight < scrollEl.scrollHeight)
                            ) {
                                break;
                            }
                            /* jshint boss:true */
                        } while (scrollEl = scrollEl.parentNode);
                    }
                }

                if (scrollEl) {
                    el = scrollEl;
                    rect = scrollEl.getBoundingClientRect();
                    vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
                    vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
                }


                if (!(vx || vy)) {
                    vx = (winWidth - x <= sens) - (x <= sens);
                    vy = (winHeight - y <= sens) - (y <= sens);

                    /* jshint expr:true */
                    (vx || vy) && (el = win);
                }


                if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
                    autoScroll.el = el;
                    autoScroll.vx = vx;
                    autoScroll.vy = vy;

                    clearInterval(autoScroll.pid);

                    if (el) {
                        autoScroll.pid = setInterval(function () {
                            if (el === win) {
                                win.scrollTo(win.pageXOffset + vx * speed, win.pageYOffset + vy * speed);
                            } else {
                                vy && (el.scrollTop += vy * speed);
                                vx && (el.scrollLeft += vx * speed);
                            }
                        }, 24);
                    }
                }
            }
        }, 30),

        _prepareGroup = function (options) {
            var group = options.group;

            if (!group || typeof group != 'object') {
                group = options.group = {name: group};
            }

            ['pull', 'put'].forEach(function (key) {
                if (!(key in group)) {
                    group[key] = true;
                }
            });

            options.groups = ' ' + group.name + (group.put.join ? ' ' + group.put.join(' ') : '') + ' ';
        }
        ;



    /**
     * @class  Sortable
     * @param  {HTMLElement}  el
     * @param  {Object}       [options]
     */
    function Sortable(el, options) {
        if (!(el && el.nodeType && el.nodeType === 1)) {
            throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el);
        }

        this.el = el; // root element
        this.options = options = _extend({}, options);


        // Export instance
        el[expando] = this;


        // Default options
        var defaults = {
            group: Math.random(),
            sort: true,
            disabled: false,
            store: null,
            handle: null,
            scroll: true,
            scrollSensitivity: 30,
            scrollSpeed: 10,
            draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            ignore: 'a, img',
            filter: null,
            animation: 0,
            setData: function (dataTransfer, dragEl) {
                dataTransfer.setData('Text', dragEl.textContent);
            },
            dropBubble: false,
            dragoverBubble: false,
            dataIdAttr: 'data-id',
            delay: 0,
            forceFallback: false,
            fallbackClass: 'sortable-fallback',
            fallbackOnBody: false
        };


        // Set default options
        for (var name in defaults) {
            !(name in options) && (options[name] = defaults[name]);
        }

        _prepareGroup(options);

        // Bind all private methods
        for (var fn in this) {
            if (fn.charAt(0) === '_') {
                this[fn] = this[fn].bind(this);
            }
        }

        // Setup drag mode
        this.nativeDraggable = options.forceFallback ? false : supportDraggable;

        // Bind events
        _on(el, 'mousedown', this._onTapStart);
        _on(el, 'touchstart', this._onTapStart);

        if (this.nativeDraggable) {
            _on(el, 'dragover', this);
            _on(el, 'dragenter', this);
        }

        touchDragOverListeners.push(this._onDragOver);

        // Restore sorting
        options.store && this.sort(options.store.get(this));
    }


    Sortable.prototype = /** @lends Sortable.prototype */ {
        constructor: Sortable,

        _onTapStart: function (/** Event|TouchEvent */evt) {
            var _this = this,
                el = this.el,
                options = this.options,
                type = evt.type,
                touch = evt.touches && evt.touches[0],
                target = (touch || evt).target,
                originalTarget = target,
                filter = options.filter;


            if (type === 'mousedown' && evt.button !== 0 || options.disabled) {
                return; // only left button or enabled
            }

            target = _closest(target, options.draggable, el);

            if (!target) {
                return;
            }

            // get the index of the dragged element within its parent
            oldIndex = _index(target, options.draggable);

            // Check filter
            if (typeof filter === 'function') {
                if (filter.call(this, evt, target, this)) {
                    _dispatchEvent(_this, originalTarget, 'filter', target, el, oldIndex);
                    evt.preventDefault();
                    return; // cancel dnd
                }
            }
            else if (filter) {
                filter = filter.split(',').some(function (criteria) {
                    criteria = _closest(originalTarget, criteria.trim(), el);

                    if (criteria) {
                        _dispatchEvent(_this, criteria, 'filter', target, el, oldIndex);
                        return true;
                    }
                });

                if (filter) {
                    evt.preventDefault();
                    return; // cancel dnd
                }
            }


            if (options.handle && !_closest(originalTarget, options.handle, el)) {
                return;
            }


            // Prepare `dragstart`
            this._prepareDragStart(evt, touch, target);
        },

        _prepareDragStart: function (/** Event */evt, /** Touch */touch, /** HTMLElement */target) {
            var _this = this,
                el = _this.el,
                options = _this.options,
                ownerDocument = el.ownerDocument,
                dragStartFn;

            if (target && !dragEl && (target.parentNode === el)) {
                tapEvt = evt;

                rootEl = el;
                dragEl = target;
                parentEl = dragEl.parentNode;
                nextEl = dragEl.nextSibling;
                activeGroup = options.group;

                dragStartFn = function () {
                    // Delayed drag has been triggered
                    // we can re-enable the events: touchmove/mousemove
                    _this._disableDelayedDrag();

                    // Make the element draggable
                    dragEl.draggable = true;

                    // Chosen item
                    _toggleClass(dragEl, _this.options.chosenClass, true);

                    // Bind the events: dragstart/dragend
                    _this._triggerDragStart(touch);
                };

                // Disable "draggable"
                options.ignore.split(',').forEach(function (criteria) {
                    _find(dragEl, criteria.trim(), _disableDraggable);
                });

                _on(ownerDocument, 'mouseup', _this._onDrop);
                _on(ownerDocument, 'touchend', _this._onDrop);
                _on(ownerDocument, 'touchcancel', _this._onDrop);

                if (options.delay) {
                    // If the user moves the pointer or let go the click or touch
                    // before the delay has been reached:
                    // disable the delayed drag
                    _on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
                    _on(ownerDocument, 'touchend', _this._disableDelayedDrag);
                    _on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
                    _on(ownerDocument, 'mousemove', _this._disableDelayedDrag);
                    _on(ownerDocument, 'touchmove', _this._disableDelayedDrag);

                    _this._dragStartTimer = setTimeout(dragStartFn, options.delay);
                } else {
                    dragStartFn();
                }
            }
        },

        _disableDelayedDrag: function () {
            var ownerDocument = this.el.ownerDocument;

            clearTimeout(this._dragStartTimer);
            _off(ownerDocument, 'mouseup', this._disableDelayedDrag);
            _off(ownerDocument, 'touchend', this._disableDelayedDrag);
            _off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
            _off(ownerDocument, 'mousemove', this._disableDelayedDrag);
            _off(ownerDocument, 'touchmove', this._disableDelayedDrag);
        },

        _triggerDragStart: function (/** Touch */touch) {
            if (touch) {
                // Touch device support
                tapEvt = {
                    target: dragEl,
                    clientX: touch.clientX,
                    clientY: touch.clientY
                };

                this._onDragStart(tapEvt, 'touch');
            }
            else if (!this.nativeDraggable) {
                this._onDragStart(tapEvt, true);
            }
            else {
                _on(dragEl, 'dragend', this);
                _on(rootEl, 'dragstart', this._onDragStart);
            }

            try {
                if (document.selection) {
                    document.selection.empty();
                } else {
                    window.getSelection().removeAllRanges();
                }
            } catch (err) {
            }
        },

        _dragStarted: function () {
            if (rootEl && dragEl) {
                // Apply effect
                _toggleClass(dragEl, this.options.ghostClass, true);

                Sortable.active = this;

                // Drag start event
                _dispatchEvent(this, rootEl, 'start', dragEl, rootEl, oldIndex);
            }
        },

        _emulateDragOver: function () {
            if (touchEvt) {
                if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
                    return;
                }

                this._lastX = touchEvt.clientX;
                this._lastY = touchEvt.clientY;

                if (!supportCssPointerEvents) {
                    _css(ghostEl, 'display', 'none');
                }

                var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),
                    parent = target,
                    groupName = ' ' + this.options.group.name + '',
                    i = touchDragOverListeners.length;

                if (parent) {
                    do {
                        if (parent[expando] && parent[expando].options.groups.indexOf(groupName) > -1) {
                            while (i--) {
                                touchDragOverListeners[i]({
                                    clientX: touchEvt.clientX,
                                    clientY: touchEvt.clientY,
                                    target: target,
                                    rootEl: parent
                                });
                            }

                            break;
                        }

                        target = parent; // store last element
                    }
                        /* jshint boss:true */
                    while (parent = parent.parentNode);
                }

                if (!supportCssPointerEvents) {
                    _css(ghostEl, 'display', '');
                }
            }
        },


        _onTouchMove: function (/**TouchEvent*/evt) {
            if (tapEvt) {
                // only set the status to dragging, when we are actually dragging
                if (!Sortable.active) {
                    this._dragStarted();
                }

                // as well as creating the ghost element on the document body
                this._appendGhost();

                var touch = evt.touches ? evt.touches[0] : evt,
                    dx = touch.clientX - tapEvt.clientX,
                    dy = touch.clientY - tapEvt.clientY,
                    translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

                moved = true;
                touchEvt = touch;

                _css(ghostEl, 'webkitTransform', translate3d);
                _css(ghostEl, 'mozTransform', translate3d);
                _css(ghostEl, 'msTransform', translate3d);
                _css(ghostEl, 'transform', translate3d);

                evt.preventDefault();
            }
        },

        _appendGhost: function () {
            if (!ghostEl) {
                var rect = dragEl.getBoundingClientRect(),
                    css = _css(dragEl),
                    options = this.options,
                    ghostRect;

                ghostEl = dragEl.cloneNode(true);

                _toggleClass(ghostEl, options.ghostClass, false);
                _toggleClass(ghostEl, options.fallbackClass, true);

                _css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
                _css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
                _css(ghostEl, 'width', rect.width);
                _css(ghostEl, 'height', rect.height);
                _css(ghostEl, 'opacity', '0.8');
                _css(ghostEl, 'position', 'fixed');
                _css(ghostEl, 'zIndex', '100000');
                _css(ghostEl, 'pointerEvents', 'none');

                options.fallbackOnBody && document.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);

                // Fixing dimensions.
                ghostRect = ghostEl.getBoundingClientRect();
                _css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
                _css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
            }
        },

        _onDragStart: function (/**Event*/evt, /**boolean*/useFallback) {
            var dataTransfer = evt.dataTransfer,
                options = this.options;

            this._offUpEvents();

            if (activeGroup.pull == 'clone') {
                cloneEl = dragEl.cloneNode(true);
                _css(cloneEl, 'display', 'none');
                rootEl.insertBefore(cloneEl, dragEl);
            }

            if (useFallback) {

                if (useFallback === 'touch') {
                    // Bind touch events
                    _on(document, 'touchmove', this._onTouchMove);
                    _on(document, 'touchend', this._onDrop);
                    _on(document, 'touchcancel', this._onDrop);
                } else {
                    // Old brwoser
                    _on(document, 'mousemove', this._onTouchMove);
                    _on(document, 'mouseup', this._onDrop);
                }

                this._loopId = setInterval(this._emulateDragOver, 50);
            }
            else {
                if (dataTransfer) {
                    dataTransfer.effectAllowed = 'move';
                    options.setData && options.setData.call(this, dataTransfer, dragEl);
                }

                _on(document, 'drop', this);
                setTimeout(this._dragStarted, 0);
            }
        },

        _onDragOver: function (/**Event*/evt) {
            var el = this.el,
                target,
                dragRect,
                revert,
                options = this.options,
                group = options.group,
                groupPut = group.put,
                isOwner = (activeGroup === group),
                canSort = options.sort;

            if (evt.preventDefault !== void 0) {
                evt.preventDefault();
                !options.dragoverBubble && evt.stopPropagation();
            }

            moved = true;

            if (activeGroup && !options.disabled &&
                (isOwner
                        ? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
                        : activeGroup.pull && groupPut && (
                        (activeGroup.name === group.name) || // by Name
                        (groupPut.indexOf && ~groupPut.indexOf(activeGroup.name)) // by Array
                    )
                ) &&
                (evt.rootEl === void 0 || evt.rootEl === this.el) // touch fallback
            ) {
                // Smart auto-scrolling
                _autoScroll(evt, options, this.el);

                if (_silent) {
                    return;
                }

                target = _closest(evt.target, options.draggable, el);
                dragRect = dragEl.getBoundingClientRect();

                if (revert) {
                    _cloneHide(true);

                    if (cloneEl || nextEl) {
                        rootEl.insertBefore(dragEl, cloneEl || nextEl);
                    }
                    else if (!canSort) {
                        rootEl.appendChild(dragEl);
                    }

                    return;
                }


                if ((el.children.length === 0) || (el.children[0] === ghostEl) ||
                    (el === evt.target) && (target = _ghostIsLast(el, evt))
                ) {

                    if (target) {
                        if (target.animated) {
                            return;
                        }

                        targetRect = target.getBoundingClientRect();
                    }

                    _cloneHide(isOwner);

                    if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect) !== false) {
                        if (!dragEl.contains(el)) {
                            el.appendChild(dragEl);
                            parentEl = el; // actualization
                        }

                        this._animate(dragRect, dragEl);
                        target && this._animate(targetRect, target);
                    }
                }
                else if (target && !target.animated && target !== dragEl && (target.parentNode[expando] !== void 0)) {
                    if (lastEl !== target) {
                        lastEl = target;
                        lastCSS = _css(target);
                        lastParentCSS = _css(target.parentNode);
                    }


                    var targetRect = target.getBoundingClientRect(),
                        width = targetRect.right - targetRect.left,
                        height = targetRect.bottom - targetRect.top,
                        floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display)
                            || (lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0),
                        isWide = (target.offsetWidth > dragEl.offsetWidth),
                        isLong = (target.offsetHeight > dragEl.offsetHeight),
                        halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5,
                        nextSibling = target.nextElementSibling,
                        moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect),
                        after
                        ;

                    if (moveVector !== false) {
                        _silent = true;
                        setTimeout(_unsilent, 30);

                        _cloneHide(isOwner);

                        if (moveVector === 1 || moveVector === -1) {
                            after = (moveVector === 1);
                        }
                        else if (floating) {
                            var elTop = dragEl.offsetTop,
                                tgTop = target.offsetTop;

                            if (elTop === tgTop) {
                                after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;
                            } else {
                                after = tgTop > elTop;
                            }
                        } else {
                            after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
                        }

                        if (!dragEl.contains(el)) {
                            if (after && !nextSibling) {
                                el.appendChild(dragEl);
                            } else {
                                target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
                            }
                        }

                        parentEl = dragEl.parentNode; // actualization

                        this._animate(dragRect, dragEl);
                        this._animate(targetRect, target);
                    }
                }
            }
        },

        _animate: function (prevRect, target) {
            var ms = this.options.animation;

            if (ms) {
                var currentRect = target.getBoundingClientRect();

                _css(target, 'transition', 'none');
                _css(target, 'transform', 'translate3d('
                    + (prevRect.left - currentRect.left) + 'px,'
                    + (prevRect.top - currentRect.top) + 'px,0)'
                );

                target.offsetWidth; // repaint

                _css(target, 'transition', 'all ' + ms + 'ms');
                _css(target, 'transform', 'translate3d(0,0,0)');

                clearTimeout(target.animated);
                target.animated = setTimeout(function () {
                    _css(target, 'transition', '');
                    _css(target, 'transform', '');
                    target.animated = false;
                }, ms);
            }
        },

        _offUpEvents: function () {
            var ownerDocument = this.el.ownerDocument;

            _off(document, 'touchmove', this._onTouchMove);
            _off(ownerDocument, 'mouseup', this._onDrop);
            _off(ownerDocument, 'touchend', this._onDrop);
            _off(ownerDocument, 'touchcancel', this._onDrop);
        },

        _onDrop: function (/**Event*/evt) {
            var el = this.el,
                options = this.options;

            clearInterval(this._loopId);
            clearInterval(autoScroll.pid);
            clearTimeout(this._dragStartTimer);

            // Unbind events
            _off(document, 'mousemove', this._onTouchMove);

            if (this.nativeDraggable) {
                _off(document, 'drop', this);
                _off(el, 'dragstart', this._onDragStart);
            }

            this._offUpEvents();

            if (evt) {
                if (moved) {
                    evt.preventDefault();
                    !options.dropBubble && evt.stopPropagation();
                }

                ghostEl && ghostEl.parentNode.removeChild(ghostEl);

                if (dragEl) {
                    if (this.nativeDraggable) {
                        _off(dragEl, 'dragend', this);
                    }

                    _disableDraggable(dragEl);

                    // Remove class's
                    _toggleClass(dragEl, this.options.ghostClass, false);
                    _toggleClass(dragEl, this.options.chosenClass, false);

                    if (rootEl !== parentEl) {
                        newIndex = _index(dragEl, options.draggable);

                        if (newIndex >= 0) {
                            // drag from one list and drop into another
                            _dispatchEvent(null, parentEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
                            _dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);

                            // Add event
                            _dispatchEvent(null, parentEl, 'add', dragEl, rootEl, oldIndex, newIndex);

                            // Remove event
                            _dispatchEvent(this, rootEl, 'remove', dragEl, rootEl, oldIndex, newIndex);
                        }
                    }
                    else {
                        // Remove clone
                        cloneEl && cloneEl.parentNode.removeChild(cloneEl);

                        if (dragEl.nextSibling !== nextEl) {
                            // Get the index of the dragged element within its parent
                            newIndex = _index(dragEl, options.draggable);

                            if (newIndex >= 0) {
                                // drag & drop within the same list
                                _dispatchEvent(this, rootEl, 'update', dragEl, rootEl, oldIndex, newIndex);
                                _dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
                            }
                        }
                    }

                    if (Sortable.active) {
                        if (newIndex === null || newIndex === -1) {
                            newIndex = oldIndex;
                        }

                        _dispatchEvent(this, rootEl, 'end', dragEl, rootEl, oldIndex, newIndex);

                        // Save sorting
                        this.save();
                    }
                }

            }
            this._nulling();
        },

        _nulling: function() {
            // Nulling
            rootEl =
                dragEl =
                    parentEl =
                        ghostEl =
                            nextEl =
                                cloneEl =

                                    scrollEl =
                                        scrollParentEl =

                                            tapEvt =
                                                touchEvt =

                                                    moved =
                                                        newIndex =

                                                            lastEl =
                                                                lastCSS =

                                                                    activeGroup =
                                                                        Sortable.active = null;
        },

        handleEvent: function (/**Event*/evt) {
            var type = evt.type;

            if (type === 'dragover' || type === 'dragenter') {
                if (dragEl) {
                    this._onDragOver(evt);
                    _globalDragOver(evt);
                }
            }
            else if (type === 'drop' || type === 'dragend') {
                this._onDrop(evt);
            }
        },


        /**
         * Serializes the item into an array of string.
         * @returns {String[]}
         */
        toArray: function () {
            var order = [],
                el,
                children = this.el.children,
                i = 0,
                n = children.length,
                options = this.options;

            for (; i < n; i++) {
                el = children[i];
                if (_closest(el, options.draggable, this.el)) {
                    order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
                }
            }

            return order;
        },


        /**
         * Sorts the elements according to the array.
         * @param  {String[]}  order  order of the items
         */
        sort: function (order) {
            var items = {}, rootEl = this.el;

            this.toArray().forEach(function (id, i) {
                var el = rootEl.children[i];

                if (_closest(el, this.options.draggable, rootEl)) {
                    items[id] = el;
                }
            }, this);

            order.forEach(function (id) {
                if (items[id]) {
                    rootEl.removeChild(items[id]);
                    rootEl.appendChild(items[id]);
                }
            });
        },


        /**
         * Save the current sorting
         */
        save: function () {
            var store = this.options.store;
            store && store.set(this);
        },


        /**
         * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
         * @param   {HTMLElement}  el
         * @param   {String}       [selector]  default: `options.draggable`
         * @returns {HTMLElement|null}
         */
        closest: function (el, selector) {
            return _closest(el, selector || this.options.draggable, this.el);
        },


        /**
         * Set/get option
         * @param   {string} name
         * @param   {*}      [value]
         * @returns {*}
         */
        option: function (name, value) {
            var options = this.options;

            if (value === void 0) {
                return options[name];
            } else {
                options[name] = value;

                if (name === 'group') {
                    _prepareGroup(options);
                }
            }
        },


        /**
         * Destroy
         */
        destroy: function () {
            var el = this.el;

            el[expando] = null;

            _off(el, 'mousedown', this._onTapStart);
            _off(el, 'touchstart', this._onTapStart);

            if (this.nativeDraggable) {
                _off(el, 'dragover', this);
                _off(el, 'dragenter', this);
            }

            // Remove draggable attributes
            Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
                el.removeAttribute('draggable');
            });

            touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

            this._onDrop();

            this.el = el = null;
        }
    };


    function _cloneHide(state) {
        if (cloneEl && (cloneEl.state !== state)) {
            _css(cloneEl, 'display', state ? 'none' : '');
            !state && cloneEl.state && rootEl.insertBefore(cloneEl, dragEl);
            cloneEl.state = state;
        }
    }


    function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {
        if (el) {
            ctx = ctx || document;

            do {
                if (
                    (selector === '>*' && el.parentNode === ctx)
                    || _matches(el, selector)
                ) {
                    return el;
                }
            }
            while (el !== ctx && (el = el.parentNode));
        }

        return null;
    }


    function _globalDragOver(/**Event*/evt) {
        if (evt.dataTransfer) {
            evt.dataTransfer.dropEffect = 'move';
        }
        evt.preventDefault();
    }


    function _on(el, event, fn) {
        el.addEventListener(event, fn, false);
    }


    function _off(el, event, fn) {
        el.removeEventListener(event, fn, false);
    }


    function _toggleClass(el, name, state) {
        if (el) {
            if (el.classList) {
                el.classList[state ? 'add' : 'remove'](name);
            }
            else {
                var className = (' ' + el.className + ' ').replace(RSPACE, ' ').replace(' ' + name + ' ', ' ');
                el.className = (className + (state ? ' ' + name : '')).replace(RSPACE, ' ');
            }
        }
    }


    function _css(el, prop, val) {
        var style = el && el.style;

        if (style) {
            if (val === void 0) {
                if (document.defaultView && document.defaultView.getComputedStyle) {
                    val = document.defaultView.getComputedStyle(el, '');
                }
                else if (el.currentStyle) {
                    val = el.currentStyle;
                }

                return prop === void 0 ? val : val[prop];
            }
            else {
                if (!(prop in style)) {
                    prop = '-webkit-' + prop;
                }

                style[prop] = val + (typeof val === 'string' ? '' : 'px');
            }
        }
    }


    function _find(ctx, tagName, iterator) {
        if (ctx) {
            var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;

            if (iterator) {
                for (; i < n; i++) {
                    iterator(list[i], i);
                }
            }

            return list;
        }

        return [];
    }



    function _dispatchEvent(sortable, rootEl, name, targetEl, fromEl, startIndex, newIndex) {
        var evt = document.createEvent('Event'),
            options = (sortable || rootEl[expando]).options,
            onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

        evt.initEvent(name, true, true);

        evt.to = rootEl;
        evt.from = fromEl || rootEl;
        evt.item = targetEl || rootEl;
        evt.clone = cloneEl;

        evt.oldIndex = startIndex;
        evt.newIndex = newIndex;

        rootEl.dispatchEvent(evt);

        if (options[onName]) {
            options[onName].call(sortable, evt);
        }
    }


    function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect) {
        var evt,
            sortable = fromEl[expando],
            onMoveFn = sortable.options.onMove,
            retVal;

        evt = document.createEvent('Event');
        evt.initEvent('move', true, true);

        evt.to = toEl;
        evt.from = fromEl;
        evt.dragged = dragEl;
        evt.draggedRect = dragRect;
        evt.related = targetEl || toEl;
        evt.relatedRect = targetRect || toEl.getBoundingClientRect();

        fromEl.dispatchEvent(evt);

        if (onMoveFn) {
            retVal = onMoveFn.call(sortable, evt);
        }

        return retVal;
    }


    function _disableDraggable(el) {
        el.draggable = false;
    }


    function _unsilent() {
        _silent = false;
    }


    /** @returns {HTMLElement|false} */
    function _ghostIsLast(el, evt) {
        var lastEl = el.lastElementChild,
            rect = lastEl.getBoundingClientRect();

        return ((evt.clientY - (rect.top + rect.height) > 5) || (evt.clientX - (rect.right + rect.width) > 5)) && lastEl; // min delta
    }


    /**
     * Generate id
     * @param   {HTMLElement} el
     * @returns {String}
     * @private
     */
    function _generateId(el) {
        var str = el.tagName + el.className + el.src + el.href + el.textContent,
            i = str.length,
            sum = 0;

        while (i--) {
            sum += str.charCodeAt(i);
        }

        return sum.toString(36);
    }

    /**
     * Returns the index of an element within its parent for a selected set of
     * elements
     * @param  {HTMLElement} el
     * @param  {selector} selector
     * @return {number}
     */
    function _index(el, selector) {
        var index = 0;

        if (!el || !el.parentNode) {
            return -1;
        }

        while (el && (el = el.previousElementSibling)) {
            if (el.nodeName.toUpperCase() !== 'TEMPLATE'
                && _matches(el, selector)) {
                index++;
            }
        }

        return index;
    }

    function _matches(/**HTMLElement*/el, /**String*/selector) {
        if (el) {
            selector = selector.split('.');

            var tag = selector.shift().toUpperCase(),
                re = new RegExp('\\s(' + selector.join('|') + ')(?=\\s)', 'g');

            return (
                (tag === '' || el.nodeName.toUpperCase() == tag) &&
                (!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length)
            );
        }

        return false;
    }

    function _throttle(callback, ms) {
        var args, _this;

        return function () {
            if (args === void 0) {
                args = arguments;
                _this = this;

                setTimeout(function () {
                    if (args.length === 1) {
                        callback.call(_this, args[0]);
                    } else {
                        callback.apply(_this, args);
                    }

                    args = void 0;
                }, ms);
            }
        };
    }

    function _extend(dst, src) {
        if (dst && src) {
            for (var key in src) {
                if (src.hasOwnProperty(key)) {
                    dst[key] = src[key];
                }
            }
        }

        return dst;
    }


    // Export utils
    Sortable.utils = {
        on: _on,
        off: _off,
        css: _css,
        find: _find,
        is: function (el, selector) {
            return !!_closest(el, selector, el);
        },
        extend: _extend,
        throttle: _throttle,
        closest: _closest,
        toggleClass: _toggleClass,
        index: _index
    };


    /**
     * Create sortable instance
     * @param {HTMLElement}  el
     * @param {Object}      [options]
     */
    Sortable.create = function (el, options) {
        return new Sortable(el, options);
    };


    // Export
    Sortable.version = '1.4.2';
    return Sortable;
});/*! Sortable 1.4.2 - MIT | git://github.com/rubaxa/Sortable.git */
!function(a){"use strict";"function"==typeof define&&define.amd?define('Sortable',[],a):"undefined"!=typeof module&&"undefined"!=typeof module.exports?module.exports.Sortable=a():"undefined"!=typeof Package?Sortable=a():window.Sortable=a()}(function(){"use strict";function a(a,b){if(!a||!a.nodeType||1!==a.nodeType)throw"Sortable: `el` must be HTMLElement, and not "+{}.toString.call(a);this.el=a,this.options=b=r({},b),a[L]=this;var c={group:Math.random(),sort:!0,disabled:!1,store:null,handle:null,scroll:!0,scrollSensitivity:30,scrollSpeed:10,draggable:/[uo]l/i.test(a.nodeName)?"li":">*",ghostClass:"sortable-ghost",chosenClass:"sortable-chosen",ignore:"a, img",filter:null,animation:0,setData:function(a,b){a.setData("Text",b.textContent)},dropBubble:!1,dragoverBubble:!1,dataIdAttr:"data-id",delay:0,forceFallback:!1,fallbackClass:"sortable-fallback",fallbackOnBody:!1};for(var d in c)!(d in b)&&(b[d]=c[d]);V(b);for(var f in this)"_"===f.charAt(0)&&(this[f]=this[f].bind(this));this.nativeDraggable=b.forceFallback?!1:P,e(a,"mousedown",this._onTapStart),e(a,"touchstart",this._onTapStart),this.nativeDraggable&&(e(a,"dragover",this),e(a,"dragenter",this)),T.push(this._onDragOver),b.store&&this.sort(b.store.get(this))}function b(a){v&&v.state!==a&&(h(v,"display",a?"none":""),!a&&v.state&&w.insertBefore(v,s),v.state=a)}function c(a,b,c){if(a){c=c||N,b=b.split(".");var d=b.shift().toUpperCase(),e=new RegExp("\\s("+b.join("|")+")(?=\\s)","g");do if(">*"===d&&a.parentNode===c||(""===d||a.nodeName.toUpperCase()==d)&&(!b.length||((" "+a.className+" ").match(e)||[]).length==b.length))return a;while(a!==c&&(a=a.parentNode))}return null}function d(a){a.dataTransfer&&(a.dataTransfer.dropEffect="move"),a.preventDefault()}function e(a,b,c){a.addEventListener(b,c,!1)}function f(a,b,c){a.removeEventListener(b,c,!1)}function g(a,b,c){if(a)if(a.classList)a.classList[c?"add":"remove"](b);else{var d=(" "+a.className+" ").replace(K," ").replace(" "+b+" "," ");a.className=(d+(c?" "+b:"")).replace(K," ")}}function h(a,b,c){var d=a&&a.style;if(d){if(void 0===c)return N.defaultView&&N.defaultView.getComputedStyle?c=N.defaultView.getComputedStyle(a,""):a.currentStyle&&(c=a.currentStyle),void 0===b?c:c[b];b in d||(b="-webkit-"+b),d[b]=c+("string"==typeof c?"":"px")}}function i(a,b,c){if(a){var d=a.getElementsByTagName(b),e=0,f=d.length;if(c)for(;f>e;e++)c(d[e],e);return d}return[]}function j(a,b,c,d,e,f,g){var h=N.createEvent("Event"),i=(a||b[L]).options,j="on"+c.charAt(0).toUpperCase()+c.substr(1);h.initEvent(c,!0,!0),h.to=b,h.from=e||b,h.item=d||b,h.clone=v,h.oldIndex=f,h.newIndex=g,b.dispatchEvent(h),i[j]&&i[j].call(a,h)}function k(a,b,c,d,e,f){var g,h,i=a[L],j=i.options.onMove;return g=N.createEvent("Event"),g.initEvent("move",!0,!0),g.to=b,g.from=a,g.dragged=c,g.draggedRect=d,g.related=e||b,g.relatedRect=f||b.getBoundingClientRect(),a.dispatchEvent(g),j&&(h=j.call(i,g)),h}function l(a){a.draggable=!1}function m(){R=!1}function n(a,b){var c=a.lastElementChild,d=c.getBoundingClientRect();return(b.clientY-(d.top+d.height)>5||b.clientX-(d.right+d.width)>5)&&c}function o(a){for(var b=a.tagName+a.className+a.src+a.href+a.textContent,c=b.length,d=0;c--;)d+=b.charCodeAt(c);return d.toString(36)}function p(a){var b=0;if(!a||!a.parentNode)return-1;for(;a&&(a=a.previousElementSibling);)"TEMPLATE"!==a.nodeName.toUpperCase()&&b++;return b}function q(a,b){var c,d;return function(){void 0===c&&(c=arguments,d=this,setTimeout(function(){1===c.length?a.call(d,c[0]):a.apply(d,c),c=void 0},b))}}function r(a,b){if(a&&b)for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a}var s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J={},K=/\s+/g,L="Sortable"+(new Date).getTime(),M=window,N=M.document,O=M.parseInt,P=!!("draggable"in N.createElement("div")),Q=function(a){return a=N.createElement("x"),a.style.cssText="pointer-events:auto","auto"===a.style.pointerEvents}(),R=!1,S=Math.abs,T=([].slice,[]),U=q(function(a,b,c){if(c&&b.scroll){var d,e,f,g,h=b.scrollSensitivity,i=b.scrollSpeed,j=a.clientX,k=a.clientY,l=window.innerWidth,m=window.innerHeight;if(z!==c&&(y=b.scroll,z=c,y===!0)){y=c;do if(y.offsetWidth<y.scrollWidth||y.offsetHeight<y.scrollHeight)break;while(y=y.parentNode)}y&&(d=y,e=y.getBoundingClientRect(),f=(S(e.right-j)<=h)-(S(e.left-j)<=h),g=(S(e.bottom-k)<=h)-(S(e.top-k)<=h)),f||g||(f=(h>=l-j)-(h>=j),g=(h>=m-k)-(h>=k),(f||g)&&(d=M)),(J.vx!==f||J.vy!==g||J.el!==d)&&(J.el=d,J.vx=f,J.vy=g,clearInterval(J.pid),d&&(J.pid=setInterval(function(){d===M?M.scrollTo(M.pageXOffset+f*i,M.pageYOffset+g*i):(g&&(d.scrollTop+=g*i),f&&(d.scrollLeft+=f*i))},24)))}},30),V=function(a){var b=a.group;b&&"object"==typeof b||(b=a.group={name:b}),["pull","put"].forEach(function(a){a in b||(b[a]=!0)}),a.groups=" "+b.name+(b.put.join?" "+b.put.join(" "):"")+" "};return a.prototype={constructor:a,_onTapStart:function(a){var b=this,d=this.el,e=this.options,f=a.type,g=a.touches&&a.touches[0],h=(g||a).target,i=h,k=e.filter;if(!("mousedown"===f&&0!==a.button||e.disabled)&&(h=c(h,e.draggable,d))){if(D=p(h),"function"==typeof k){if(k.call(this,a,h,this))return j(b,i,"filter",h,d,D),void a.preventDefault()}else if(k&&(k=k.split(",").some(function(a){return a=c(i,a.trim(),d),a?(j(b,a,"filter",h,d,D),!0):void 0})))return void a.preventDefault();(!e.handle||c(i,e.handle,d))&&this._prepareDragStart(a,g,h)}},_prepareDragStart:function(a,b,c){var d,f=this,h=f.el,j=f.options,k=h.ownerDocument;c&&!s&&c.parentNode===h&&(G=a,w=h,s=c,t=s.parentNode,x=s.nextSibling,F=j.group,d=function(){f._disableDelayedDrag(),s.draggable=!0,g(s,f.options.chosenClass,!0),f._triggerDragStart(b)},j.ignore.split(",").forEach(function(a){i(s,a.trim(),l)}),e(k,"mouseup",f._onDrop),e(k,"touchend",f._onDrop),e(k,"touchcancel",f._onDrop),j.delay?(e(k,"mouseup",f._disableDelayedDrag),e(k,"touchend",f._disableDelayedDrag),e(k,"touchcancel",f._disableDelayedDrag),e(k,"mousemove",f._disableDelayedDrag),e(k,"touchmove",f._disableDelayedDrag),f._dragStartTimer=setTimeout(d,j.delay)):d())},_disableDelayedDrag:function(){var a=this.el.ownerDocument;clearTimeout(this._dragStartTimer),f(a,"mouseup",this._disableDelayedDrag),f(a,"touchend",this._disableDelayedDrag),f(a,"touchcancel",this._disableDelayedDrag),f(a,"mousemove",this._disableDelayedDrag),f(a,"touchmove",this._disableDelayedDrag)},_triggerDragStart:function(a){a?(G={target:s,clientX:a.clientX,clientY:a.clientY},this._onDragStart(G,"touch")):this.nativeDraggable?(e(s,"dragend",this),e(w,"dragstart",this._onDragStart)):this._onDragStart(G,!0);try{N.selection?N.selection.empty():window.getSelection().removeAllRanges()}catch(b){}},_dragStarted:function(){w&&s&&(g(s,this.options.ghostClass,!0),a.active=this,j(this,w,"start",s,w,D))},_emulateDragOver:function(){if(H){if(this._lastX===H.clientX&&this._lastY===H.clientY)return;this._lastX=H.clientX,this._lastY=H.clientY,Q||h(u,"display","none");var a=N.elementFromPoint(H.clientX,H.clientY),b=a,c=" "+this.options.group.name,d=T.length;if(b)do{if(b[L]&&b[L].options.groups.indexOf(c)>-1){for(;d--;)T[d]({clientX:H.clientX,clientY:H.clientY,target:a,rootEl:b});break}a=b}while(b=b.parentNode);Q||h(u,"display","")}},_onTouchMove:function(b){if(G){a.active||this._dragStarted(),this._appendGhost();var c=b.touches?b.touches[0]:b,d=c.clientX-G.clientX,e=c.clientY-G.clientY,f=b.touches?"translate3d("+d+"px,"+e+"px,0)":"translate("+d+"px,"+e+"px)";I=!0,H=c,h(u,"webkitTransform",f),h(u,"mozTransform",f),h(u,"msTransform",f),h(u,"transform",f),b.preventDefault()}},_appendGhost:function(){if(!u){var a,b=s.getBoundingClientRect(),c=h(s),d=this.options;u=s.cloneNode(!0),g(u,d.ghostClass,!1),g(u,d.fallbackClass,!0),h(u,"top",b.top-O(c.marginTop,10)),h(u,"left",b.left-O(c.marginLeft,10)),h(u,"width",b.width),h(u,"height",b.height),h(u,"opacity","0.8"),h(u,"position","fixed"),h(u,"zIndex","100000"),h(u,"pointerEvents","none"),d.fallbackOnBody&&N.body.appendChild(u)||w.appendChild(u),a=u.getBoundingClientRect(),h(u,"width",2*b.width-a.width),h(u,"height",2*b.height-a.height)}},_onDragStart:function(a,b){var c=a.dataTransfer,d=this.options;this._offUpEvents(),"clone"==F.pull&&(v=s.cloneNode(!0),h(v,"display","none"),w.insertBefore(v,s)),b?("touch"===b?(e(N,"touchmove",this._onTouchMove),e(N,"touchend",this._onDrop),e(N,"touchcancel",this._onDrop)):(e(N,"mousemove",this._onTouchMove),e(N,"mouseup",this._onDrop)),this._loopId=setInterval(this._emulateDragOver,50)):(c&&(c.effectAllowed="move",d.setData&&d.setData.call(this,c,s)),e(N,"drop",this),setTimeout(this._dragStarted,0))},_onDragOver:function(a){var d,e,f,g=this.el,i=this.options,j=i.group,l=j.put,o=F===j,p=i.sort;if(void 0!==a.preventDefault&&(a.preventDefault(),!i.dragoverBubble&&a.stopPropagation()),I=!0,F&&!i.disabled&&(o?p||(f=!w.contains(s)):F.pull&&l&&(F.name===j.name||l.indexOf&&~l.indexOf(F.name)))&&(void 0===a.rootEl||a.rootEl===this.el)){if(U(a,i,this.el),R)return;if(d=c(a.target,i.draggable,g),e=s.getBoundingClientRect(),f)return b(!0),void(v||x?w.insertBefore(s,v||x):p||w.appendChild(s));if(0===g.children.length||g.children[0]===u||g===a.target&&(d=n(g,a))){if(d){if(d.animated)return;r=d.getBoundingClientRect()}b(o),k(w,g,s,e,d,r)!==!1&&(s.contains(g)||(g.appendChild(s),t=g),this._animate(e,s),d&&this._animate(r,d))}else if(d&&!d.animated&&d!==s&&void 0!==d.parentNode[L]){A!==d&&(A=d,B=h(d),C=h(d.parentNode));var q,r=d.getBoundingClientRect(),y=r.right-r.left,z=r.bottom-r.top,D=/left|right|inline/.test(B.cssFloat+B.display)||"flex"==C.display&&0===C["flex-direction"].indexOf("row"),E=d.offsetWidth>s.offsetWidth,G=d.offsetHeight>s.offsetHeight,H=(D?(a.clientX-r.left)/y:(a.clientY-r.top)/z)>.5,J=d.nextElementSibling,K=k(w,g,s,e,d,r);if(K!==!1){if(R=!0,setTimeout(m,30),b(o),1===K||-1===K)q=1===K;else if(D){var M=s.offsetTop,N=d.offsetTop;q=M===N?d.previousElementSibling===s&&!E||H&&E:N>M}else q=J!==s&&!G||H&&G;s.contains(g)||(q&&!J?g.appendChild(s):d.parentNode.insertBefore(s,q?J:d)),t=s.parentNode,this._animate(e,s),this._animate(r,d)}}}},_animate:function(a,b){var c=this.options.animation;if(c){var d=b.getBoundingClientRect();h(b,"transition","none"),h(b,"transform","translate3d("+(a.left-d.left)+"px,"+(a.top-d.top)+"px,0)"),b.offsetWidth,h(b,"transition","all "+c+"ms"),h(b,"transform","translate3d(0,0,0)"),clearTimeout(b.animated),b.animated=setTimeout(function(){h(b,"transition",""),h(b,"transform",""),b.animated=!1},c)}},_offUpEvents:function(){var a=this.el.ownerDocument;f(N,"touchmove",this._onTouchMove),f(a,"mouseup",this._onDrop),f(a,"touchend",this._onDrop),f(a,"touchcancel",this._onDrop)},_onDrop:function(b){var c=this.el,d=this.options;clearInterval(this._loopId),clearInterval(J.pid),clearTimeout(this._dragStartTimer),f(N,"mousemove",this._onTouchMove),this.nativeDraggable&&(f(N,"drop",this),f(c,"dragstart",this._onDragStart)),this._offUpEvents(),b&&(I&&(b.preventDefault(),!d.dropBubble&&b.stopPropagation()),u&&u.parentNode.removeChild(u),s&&(this.nativeDraggable&&f(s,"dragend",this),l(s),g(s,this.options.ghostClass,!1),g(s,this.options.chosenClass,!1),w!==t?(E=p(s),E>=0&&(j(null,t,"sort",s,w,D,E),j(this,w,"sort",s,w,D,E),j(null,t,"add",s,w,D,E),j(this,w,"remove",s,w,D,E))):(v&&v.parentNode.removeChild(v),s.nextSibling!==x&&(E=p(s),E>=0&&(j(this,w,"update",s,w,D,E),j(this,w,"sort",s,w,D,E)))),a.active&&((null===E||-1===E)&&(E=D),j(this,w,"end",s,w,D,E),this.save())),w=s=t=u=x=v=y=z=G=H=I=E=A=B=F=a.active=null)},handleEvent:function(a){var b=a.type;"dragover"===b||"dragenter"===b?s&&(this._onDragOver(a),d(a)):("drop"===b||"dragend"===b)&&this._onDrop(a)},toArray:function(){for(var a,b=[],d=this.el.children,e=0,f=d.length,g=this.options;f>e;e++)a=d[e],c(a,g.draggable,this.el)&&b.push(a.getAttribute(g.dataIdAttr)||o(a));return b},sort:function(a){var b={},d=this.el;this.toArray().forEach(function(a,e){var f=d.children[e];c(f,this.options.draggable,d)&&(b[a]=f)},this),a.forEach(function(a){b[a]&&(d.removeChild(b[a]),d.appendChild(b[a]))})},save:function(){var a=this.options.store;a&&a.set(this)},closest:function(a,b){return c(a,b||this.options.draggable,this.el)},option:function(a,b){var c=this.options;return void 0===b?c[a]:(c[a]=b,void("group"===a&&V(c)))},destroy:function(){var a=this.el;a[L]=null,f(a,"mousedown",this._onTapStart),f(a,"touchstart",this._onTapStart),this.nativeDraggable&&(f(a,"dragover",this),f(a,"dragenter",this)),Array.prototype.forEach.call(a.querySelectorAll("[draggable]"),function(a){a.removeAttribute("draggable")}),T.splice(T.indexOf(this._onDragOver),1),this._onDrop(),this.el=a=null}},a.utils={on:e,off:f,css:h,find:i,is:function(a,b){return!!c(a,b,a)},extend:r,throttle:q,closest:c,toggleClass:g,index:p},a.create=function(b,c){return new a(b,c)},a.version="1.4.2",a});
;/**
 * @fileoverview
 * - Using the 'QRCode for Javascript library'
 * - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
 * - this library has no dependencies.
 * 
 * @author davidshimjs
 * @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
 * @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
 */
var QRCode;

(function () {
	//---------------------------------------------------------------------
	// QRCode for JavaScript
	//
	// Copyright (c) 2009 Kazuhiko Arase
	//
	// URL: http://www.d-project.com/
	//
	// Licensed under the MIT license:
	//   http://www.opensource.org/licenses/mit-license.php
	//
	// The word "QR Code" is registered trademark of 
	// DENSO WAVE INCORPORATED
	//   http://www.denso-wave.com/qrcode/faqpatent-e.html
	//
	//---------------------------------------------------------------------
	function QR8bitByte(data) {
		this.mode = QRMode.MODE_8BIT_BYTE;
		this.data = data;
		this.parsedData = [];

		// Added to support UTF-8 Characters
		for (var i = 0, l = this.data.length; i < l; i++) {
			var byteArray = [];
			var code = this.data.charCodeAt(i);

			if (code > 0x10000) {
				byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
				byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
				byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
				byteArray[3] = 0x80 | (code & 0x3F);
			} else if (code > 0x800) {
				byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
				byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
				byteArray[2] = 0x80 | (code & 0x3F);
			} else if (code > 0x80) {
				byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
				byteArray[1] = 0x80 | (code & 0x3F);
			} else {
				byteArray[0] = code;
			}

			this.parsedData.push(byteArray);
		}

		this.parsedData = Array.prototype.concat.apply([], this.parsedData);

		if (this.parsedData.length != this.data.length) {
			this.parsedData.unshift(191);
			this.parsedData.unshift(187);
			this.parsedData.unshift(239);
		}
	}

	QR8bitByte.prototype = {
		getLength: function (buffer) {
			return this.parsedData.length;
		},
		write: function (buffer) {
			for (var i = 0, l = this.parsedData.length; i < l; i++) {
				buffer.put(this.parsedData[i], 8);
			}
		}
	};

	function QRCodeModel(typeNumber, errorCorrectLevel) {
		this.typeNumber = typeNumber;
		this.errorCorrectLevel = errorCorrectLevel;
		this.modules = null;
		this.moduleCount = 0;
		this.dataCache = null;
		this.dataList = [];
	}

	QRCodeModel.prototype={addData:function(data){var newData=new QR8bitByte(data);this.dataList.push(newData);this.dataCache=null;},isDark:function(row,col){if(row<0||this.moduleCount<=row||col<0||this.moduleCount<=col){throw new Error(row+","+col);}
	return this.modules[row][col];},getModuleCount:function(){return this.moduleCount;},make:function(){this.makeImpl(false,this.getBestMaskPattern());},makeImpl:function(test,maskPattern){this.moduleCount=this.typeNumber*4+17;this.modules=new Array(this.moduleCount);for(var row=0;row<this.moduleCount;row++){this.modules[row]=new Array(this.moduleCount);for(var col=0;col<this.moduleCount;col++){this.modules[row][col]=null;}}
	this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(test,maskPattern);if(this.typeNumber>=7){this.setupTypeNumber(test);}
	if(this.dataCache==null){this.dataCache=QRCodeModel.createData(this.typeNumber,this.errorCorrectLevel,this.dataList);}
	this.mapData(this.dataCache,maskPattern);},setupPositionProbePattern:function(row,col){for(var r=-1;r<=7;r++){if(row+r<=-1||this.moduleCount<=row+r)continue;for(var c=-1;c<=7;c++){if(col+c<=-1||this.moduleCount<=col+c)continue;if((0<=r&&r<=6&&(c==0||c==6))||(0<=c&&c<=6&&(r==0||r==6))||(2<=r&&r<=4&&2<=c&&c<=4)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}},getBestMaskPattern:function(){var minLostPoint=0;var pattern=0;for(var i=0;i<8;i++){this.makeImpl(true,i);var lostPoint=QRUtil.getLostPoint(this);if(i==0||minLostPoint>lostPoint){minLostPoint=lostPoint;pattern=i;}}
	return pattern;},createMovieClip:function(target_mc,instance_name,depth){var qr_mc=target_mc.createEmptyMovieClip(instance_name,depth);var cs=1;this.make();for(var row=0;row<this.modules.length;row++){var y=row*cs;for(var col=0;col<this.modules[row].length;col++){var x=col*cs;var dark=this.modules[row][col];if(dark){qr_mc.beginFill(0,100);qr_mc.moveTo(x,y);qr_mc.lineTo(x+cs,y);qr_mc.lineTo(x+cs,y+cs);qr_mc.lineTo(x,y+cs);qr_mc.endFill();}}}
	return qr_mc;},setupTimingPattern:function(){for(var r=8;r<this.moduleCount-8;r++){if(this.modules[r][6]!=null){continue;}
	this.modules[r][6]=(r%2==0);}
	for(var c=8;c<this.moduleCount-8;c++){if(this.modules[6][c]!=null){continue;}
	this.modules[6][c]=(c%2==0);}},setupPositionAdjustPattern:function(){var pos=QRUtil.getPatternPosition(this.typeNumber);for(var i=0;i<pos.length;i++){for(var j=0;j<pos.length;j++){var row=pos[i];var col=pos[j];if(this.modules[row][col]!=null){continue;}
	for(var r=-2;r<=2;r++){for(var c=-2;c<=2;c++){if(r==-2||r==2||c==-2||c==2||(r==0&&c==0)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}}}},setupTypeNumber:function(test){var bits=QRUtil.getBCHTypeNumber(this.typeNumber);for(var i=0;i<18;i++){var mod=(!test&&((bits>>i)&1)==1);this.modules[Math.floor(i/3)][i%3+this.moduleCount-8-3]=mod;}
	for(var i=0;i<18;i++){var mod=(!test&&((bits>>i)&1)==1);this.modules[i%3+this.moduleCount-8-3][Math.floor(i/3)]=mod;}},setupTypeInfo:function(test,maskPattern){var data=(this.errorCorrectLevel<<3)|maskPattern;var bits=QRUtil.getBCHTypeInfo(data);for(var i=0;i<15;i++){var mod=(!test&&((bits>>i)&1)==1);if(i<6){this.modules[i][8]=mod;}else if(i<8){this.modules[i+1][8]=mod;}else{this.modules[this.moduleCount-15+i][8]=mod;}}
	for(var i=0;i<15;i++){var mod=(!test&&((bits>>i)&1)==1);if(i<8){this.modules[8][this.moduleCount-i-1]=mod;}else if(i<9){this.modules[8][15-i-1+1]=mod;}else{this.modules[8][15-i-1]=mod;}}
	this.modules[this.moduleCount-8][8]=(!test);},mapData:function(data,maskPattern){var inc=-1;var row=this.moduleCount-1;var bitIndex=7;var byteIndex=0;for(var col=this.moduleCount-1;col>0;col-=2){if(col==6)col--;while(true){for(var c=0;c<2;c++){if(this.modules[row][col-c]==null){var dark=false;if(byteIndex<data.length){dark=(((data[byteIndex]>>>bitIndex)&1)==1);}
	var mask=QRUtil.getMask(maskPattern,row,col-c);if(mask){dark=!dark;}
	this.modules[row][col-c]=dark;bitIndex--;if(bitIndex==-1){byteIndex++;bitIndex=7;}}}
	row+=inc;if(row<0||this.moduleCount<=row){row-=inc;inc=-inc;break;}}}}};QRCodeModel.PAD0=0xEC;QRCodeModel.PAD1=0x11;QRCodeModel.createData=function(typeNumber,errorCorrectLevel,dataList){var rsBlocks=QRRSBlock.getRSBlocks(typeNumber,errorCorrectLevel);var buffer=new QRBitBuffer();for(var i=0;i<dataList.length;i++){var data=dataList[i];buffer.put(data.mode,4);buffer.put(data.getLength(),QRUtil.getLengthInBits(data.mode,typeNumber));data.write(buffer);}
	var totalDataCount=0;for(var i=0;i<rsBlocks.length;i++){totalDataCount+=rsBlocks[i].dataCount;}
	if(buffer.getLengthInBits()>totalDataCount*8){throw new Error("code length overflow. ("
	+buffer.getLengthInBits()
	+">"
	+totalDataCount*8
	+")");}
	if(buffer.getLengthInBits()+4<=totalDataCount*8){buffer.put(0,4);}
	while(buffer.getLengthInBits()%8!=0){buffer.putBit(false);}
	while(true){if(buffer.getLengthInBits()>=totalDataCount*8){break;}
	buffer.put(QRCodeModel.PAD0,8);if(buffer.getLengthInBits()>=totalDataCount*8){break;}
	buffer.put(QRCodeModel.PAD1,8);}
	return QRCodeModel.createBytes(buffer,rsBlocks);};QRCodeModel.createBytes=function(buffer,rsBlocks){var offset=0;var maxDcCount=0;var maxEcCount=0;var dcdata=new Array(rsBlocks.length);var ecdata=new Array(rsBlocks.length);for(var r=0;r<rsBlocks.length;r++){var dcCount=rsBlocks[r].dataCount;var ecCount=rsBlocks[r].totalCount-dcCount;maxDcCount=Math.max(maxDcCount,dcCount);maxEcCount=Math.max(maxEcCount,ecCount);dcdata[r]=new Array(dcCount);for(var i=0;i<dcdata[r].length;i++){dcdata[r][i]=0xff&buffer.buffer[i+offset];}
	offset+=dcCount;var rsPoly=QRUtil.getErrorCorrectPolynomial(ecCount);var rawPoly=new QRPolynomial(dcdata[r],rsPoly.getLength()-1);var modPoly=rawPoly.mod(rsPoly);ecdata[r]=new Array(rsPoly.getLength()-1);for(var i=0;i<ecdata[r].length;i++){var modIndex=i+modPoly.getLength()-ecdata[r].length;ecdata[r][i]=(modIndex>=0)?modPoly.get(modIndex):0;}}
	var totalCodeCount=0;for(var i=0;i<rsBlocks.length;i++){totalCodeCount+=rsBlocks[i].totalCount;}
	var data=new Array(totalCodeCount);var index=0;for(var i=0;i<maxDcCount;i++){for(var r=0;r<rsBlocks.length;r++){if(i<dcdata[r].length){data[index++]=dcdata[r][i];}}}
	for(var i=0;i<maxEcCount;i++){for(var r=0;r<rsBlocks.length;r++){if(i<ecdata[r].length){data[index++]=ecdata[r][i];}}}
	return data;};var QRMode={MODE_NUMBER:1<<0,MODE_ALPHA_NUM:1<<1,MODE_8BIT_BYTE:1<<2,MODE_KANJI:1<<3};var QRErrorCorrectLevel={L:1,M:0,Q:3,H:2};var QRMaskPattern={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};var QRUtil={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|(1<<0),G18:(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|(1<<0),G15_MASK:(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1),getBCHTypeInfo:function(data){var d=data<<10;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)>=0){d^=(QRUtil.G15<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)));}
	return((data<<10)|d)^QRUtil.G15_MASK;},getBCHTypeNumber:function(data){var d=data<<12;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)>=0){d^=(QRUtil.G18<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)));}
	return(data<<12)|d;},getBCHDigit:function(data){var digit=0;while(data!=0){digit++;data>>>=1;}
	return digit;},getPatternPosition:function(typeNumber){return QRUtil.PATTERN_POSITION_TABLE[typeNumber-1];},getMask:function(maskPattern,i,j){switch(maskPattern){case QRMaskPattern.PATTERN000:return(i+j)%2==0;case QRMaskPattern.PATTERN001:return i%2==0;case QRMaskPattern.PATTERN010:return j%3==0;case QRMaskPattern.PATTERN011:return(i+j)%3==0;case QRMaskPattern.PATTERN100:return(Math.floor(i/2)+Math.floor(j/3))%2==0;case QRMaskPattern.PATTERN101:return(i*j)%2+(i*j)%3==0;case QRMaskPattern.PATTERN110:return((i*j)%2+(i*j)%3)%2==0;case QRMaskPattern.PATTERN111:return((i*j)%3+(i+j)%2)%2==0;default:throw new Error("bad maskPattern:"+maskPattern);}},getErrorCorrectPolynomial:function(errorCorrectLength){var a=new QRPolynomial([1],0);for(var i=0;i<errorCorrectLength;i++){a=a.multiply(new QRPolynomial([1,QRMath.gexp(i)],0));}
	return a;},getLengthInBits:function(mode,type){if(1<=type&&type<10){switch(mode){case QRMode.MODE_NUMBER:return 10;case QRMode.MODE_ALPHA_NUM:return 9;case QRMode.MODE_8BIT_BYTE:return 8;case QRMode.MODE_KANJI:return 8;default:throw new Error("mode:"+mode);}}else if(type<27){switch(mode){case QRMode.MODE_NUMBER:return 12;case QRMode.MODE_ALPHA_NUM:return 11;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 10;default:throw new Error("mode:"+mode);}}else if(type<41){switch(mode){case QRMode.MODE_NUMBER:return 14;case QRMode.MODE_ALPHA_NUM:return 13;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 12;default:throw new Error("mode:"+mode);}}else{throw new Error("type:"+type);}},getLostPoint:function(qrCode){var moduleCount=qrCode.getModuleCount();var lostPoint=0;for(var row=0;row<moduleCount;row++){for(var col=0;col<moduleCount;col++){var sameCount=0;var dark=qrCode.isDark(row,col);for(var r=-1;r<=1;r++){if(row+r<0||moduleCount<=row+r){continue;}
	for(var c=-1;c<=1;c++){if(col+c<0||moduleCount<=col+c){continue;}
	if(r==0&&c==0){continue;}
	if(dark==qrCode.isDark(row+r,col+c)){sameCount++;}}}
	if(sameCount>5){lostPoint+=(3+sameCount-5);}}}
	for(var row=0;row<moduleCount-1;row++){for(var col=0;col<moduleCount-1;col++){var count=0;if(qrCode.isDark(row,col))count++;if(qrCode.isDark(row+1,col))count++;if(qrCode.isDark(row,col+1))count++;if(qrCode.isDark(row+1,col+1))count++;if(count==0||count==4){lostPoint+=3;}}}
	for(var row=0;row<moduleCount;row++){for(var col=0;col<moduleCount-6;col++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row,col+1)&&qrCode.isDark(row,col+2)&&qrCode.isDark(row,col+3)&&qrCode.isDark(row,col+4)&&!qrCode.isDark(row,col+5)&&qrCode.isDark(row,col+6)){lostPoint+=40;}}}
	for(var col=0;col<moduleCount;col++){for(var row=0;row<moduleCount-6;row++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row+1,col)&&qrCode.isDark(row+2,col)&&qrCode.isDark(row+3,col)&&qrCode.isDark(row+4,col)&&!qrCode.isDark(row+5,col)&&qrCode.isDark(row+6,col)){lostPoint+=40;}}}
	var darkCount=0;for(var col=0;col<moduleCount;col++){for(var row=0;row<moduleCount;row++){if(qrCode.isDark(row,col)){darkCount++;}}}
	var ratio=Math.abs(100*darkCount/moduleCount/moduleCount-50)/5;lostPoint+=ratio*10;return lostPoint;}};var QRMath={glog:function(n){if(n<1){throw new Error("glog("+n+")");}
	return QRMath.LOG_TABLE[n];},gexp:function(n){while(n<0){n+=255;}
	while(n>=256){n-=255;}
	return QRMath.EXP_TABLE[n];},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)};for(var i=0;i<8;i++){QRMath.EXP_TABLE[i]=1<<i;}
	for(var i=8;i<256;i++){QRMath.EXP_TABLE[i]=QRMath.EXP_TABLE[i-4]^QRMath.EXP_TABLE[i-5]^QRMath.EXP_TABLE[i-6]^QRMath.EXP_TABLE[i-8];}
	for(var i=0;i<255;i++){QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]]=i;}
	function QRPolynomial(num,shift){if(num.length==undefined){throw new Error(num.length+"/"+shift);}
	var offset=0;while(offset<num.length&&num[offset]==0){offset++;}
	this.num=new Array(num.length-offset+shift);for(var i=0;i<num.length-offset;i++){this.num[i]=num[i+offset];}}
	QRPolynomial.prototype={get:function(index){return this.num[index];},getLength:function(){return this.num.length;},multiply:function(e){var num=new Array(this.getLength()+e.getLength()-1);for(var i=0;i<this.getLength();i++){for(var j=0;j<e.getLength();j++){num[i+j]^=QRMath.gexp(QRMath.glog(this.get(i))+QRMath.glog(e.get(j)));}}
	return new QRPolynomial(num,0);},mod:function(e){if(this.getLength()-e.getLength()<0){return this;}
	var ratio=QRMath.glog(this.get(0))-QRMath.glog(e.get(0));var num=new Array(this.getLength());for(var i=0;i<this.getLength();i++){num[i]=this.get(i);}
	for(var i=0;i<e.getLength();i++){num[i]^=QRMath.gexp(QRMath.glog(e.get(i))+ratio);}
	return new QRPolynomial(num,0).mod(e);}};function QRRSBlock(totalCount,dataCount){this.totalCount=totalCount;this.dataCount=dataCount;}
	QRRSBlock.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];QRRSBlock.getRSBlocks=function(typeNumber,errorCorrectLevel){var rsBlock=QRRSBlock.getRsBlockTable(typeNumber,errorCorrectLevel);if(rsBlock==undefined){throw new Error("bad rs block @ typeNumber:"+typeNumber+"/errorCorrectLevel:"+errorCorrectLevel);}
	var length=rsBlock.length/3;var list=[];for(var i=0;i<length;i++){var count=rsBlock[i*3+0];var totalCount=rsBlock[i*3+1];var dataCount=rsBlock[i*3+2];for(var j=0;j<count;j++){list.push(new QRRSBlock(totalCount,dataCount));}}
	return list;};QRRSBlock.getRsBlockTable=function(typeNumber,errorCorrectLevel){switch(errorCorrectLevel){case QRErrorCorrectLevel.L:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+0];case QRErrorCorrectLevel.M:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+1];case QRErrorCorrectLevel.Q:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+2];case QRErrorCorrectLevel.H:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+3];default:return undefined;}};function QRBitBuffer(){this.buffer=[];this.length=0;}
	QRBitBuffer.prototype={get:function(index){var bufIndex=Math.floor(index/8);return((this.buffer[bufIndex]>>>(7-index%8))&1)==1;},put:function(num,length){for(var i=0;i<length;i++){this.putBit(((num>>>(length-i-1))&1)==1);}},getLengthInBits:function(){return this.length;},putBit:function(bit){var bufIndex=Math.floor(this.length/8);if(this.buffer.length<=bufIndex){this.buffer.push(0);}
	if(bit){this.buffer[bufIndex]|=(0x80>>>(this.length%8));}
	this.length++;}};var QRCodeLimitLength=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]];
	
	function _isSupportCanvas() {
		return typeof CanvasRenderingContext2D != "undefined";
	}
	
	// android 2.x doesn't support Data-URI spec
	function _getAndroid() {
		var android = false;
		var sAgent = navigator.userAgent;
		
		if (/android/i.test(sAgent)) { // android
			android = true;
			var aMat = sAgent.toString().match(/android ([0-9]\.[0-9])/i);
			
			if (aMat && aMat[1]) {
				android = parseFloat(aMat[1]);
			}
		}
		
		return android;
	}
	
	var svgDrawer = (function() {

		var Drawing = function (el, htOption) {
			this._el = el;
			this._htOption = htOption;
		};

		Drawing.prototype.draw = function (oQRCode) {
			var _htOption = this._htOption;
			var _el = this._el;
			var nCount = oQRCode.getModuleCount();
			var nWidth = Math.floor(_htOption.width / nCount);
			var nHeight = Math.floor(_htOption.height / nCount);

			this.clear();

			function makeSVG(tag, attrs) {
				var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
				for (var k in attrs)
					if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
				return el;
			}

			var svg = makeSVG("svg" , {'viewBox': '0 0 ' + String(nCount) + " " + String(nCount), 'width': '100%', 'height': '100%', 'fill': _htOption.colorLight});
			svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			_el.appendChild(svg);

			svg.appendChild(makeSVG("rect", {"fill": _htOption.colorLight, "width": "100%", "height": "100%"}));
			svg.appendChild(makeSVG("rect", {"fill": _htOption.colorDark, "width": "1", "height": "1", "id": "template"}));

			for (var row = 0; row < nCount; row++) {
				for (var col = 0; col < nCount; col++) {
					if (oQRCode.isDark(row, col)) {
						var child = makeSVG("use", {"x": String(col), "y": String(row)});
						child.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template")
						svg.appendChild(child);
					}
				}
			}
		};
		Drawing.prototype.clear = function () {
			while (this._el.hasChildNodes())
				this._el.removeChild(this._el.lastChild);
		};
		return Drawing;
	})();

	var useSVG = document.documentElement.tagName.toLowerCase() === "svg";

	// Drawing in DOM by using Table tag
	var Drawing = useSVG ? svgDrawer : !_isSupportCanvas() ? (function () {
		var Drawing = function (el, htOption) {
			this._el = el;
			this._htOption = htOption;
		};
			
		/**
		 * Draw the QRCode
		 * 
		 * @param {QRCode} oQRCode
		 */
		Drawing.prototype.draw = function (oQRCode) {
            var _htOption = this._htOption;
            var _el = this._el;
			var nCount = oQRCode.getModuleCount();
			var nWidth = Math.floor(_htOption.width / nCount);
			var nHeight = Math.floor(_htOption.height / nCount);
			var aHTML = ['<table style="border:0;border-collapse:collapse;">'];
			
			for (var row = 0; row < nCount; row++) {
				aHTML.push('<tr>');
				
				for (var col = 0; col < nCount; col++) {
					aHTML.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + nWidth + 'px;height:' + nHeight + 'px;background-color:' + (oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight) + ';"></td>');
				}
				
				aHTML.push('</tr>');
			}
			
			aHTML.push('</table>');
			_el.innerHTML = aHTML.join('');
			
			// Fix the margin values as real size.
			var elTable = _el.childNodes[0];
			var nLeftMarginTable = (_htOption.width - elTable.offsetWidth) / 2;
			var nTopMarginTable = (_htOption.height - elTable.offsetHeight) / 2;
			
			if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
				elTable.style.margin = nTopMarginTable + "px " + nLeftMarginTable + "px";	
			}
		};
		
		/**
		 * Clear the QRCode
		 */
		Drawing.prototype.clear = function () {
			this._el.innerHTML = '';
		};
		
		return Drawing;
	})() : (function () { // Drawing in Canvas
		function _onMakeImage() {
			this._elImage.src = this._elCanvas.toDataURL("image/png");
			this._elImage.style.display = "block";
			this._elCanvas.style.display = "none";			
		}
		
		// Android 2.1 bug workaround
		// http://code.google.com/p/android/issues/detail?id=5141
		if (this._android && this._android <= 2.1) {
	    	var factor = 1 / window.devicePixelRatio;
	        var drawImage = CanvasRenderingContext2D.prototype.drawImage; 
	    	CanvasRenderingContext2D.prototype.drawImage = function (image, sx, sy, sw, sh, dx, dy, dw, dh) {
	    		if (("nodeName" in image) && /img/i.test(image.nodeName)) {
		        	for (var i = arguments.length - 1; i >= 1; i--) {
		            	arguments[i] = arguments[i] * factor;
		        	}
	    		} else if (typeof dw == "undefined") {
	    			arguments[1] *= factor;
	    			arguments[2] *= factor;
	    			arguments[3] *= factor;
	    			arguments[4] *= factor;
	    		}
	    		
	        	drawImage.apply(this, arguments); 
	    	};
		}
		
		/**
		 * Check whether the user's browser supports Data URI or not
		 * 
		 * @private
		 * @param {Function} fSuccess Occurs if it supports Data URI
		 * @param {Function} fFail Occurs if it doesn't support Data URI
		 */
		function _safeSetDataURI(fSuccess, fFail) {
            var self = this;
            self._fFail = fFail;
            self._fSuccess = fSuccess;

            // Check it just once
            if (self._bSupportDataURI === null) {
                var el = document.createElement("img");
                var fOnError = function() {
                    self._bSupportDataURI = false;

                    if (self._fFail) {
                        self._fFail.call(self);
                    }
                };
                var fOnSuccess = function() {
                    self._bSupportDataURI = true;

                    if (self._fSuccess) {
                        self._fSuccess.call(self);
                    }
                };

                el.onabort = fOnError;
                el.onerror = fOnError;
                el.onload = fOnSuccess;
                el.src = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="; // the Image contains 1px data.
                return;
            } else if (self._bSupportDataURI === true && self._fSuccess) {
                self._fSuccess.call(self);
            } else if (self._bSupportDataURI === false && self._fFail) {
                self._fFail.call(self);
            }
		};
		
		/**
		 * Drawing QRCode by using canvas
		 * 
		 * @constructor
		 * @param {HTMLElement} el
		 * @param {Object} htOption QRCode Options 
		 */
		var Drawing = function (el, htOption) {
    		this._bIsPainted = false;
    		this._android = _getAndroid();
		
			this._htOption = htOption;
			this._elCanvas = document.createElement("canvas");
			this._elCanvas.width = htOption.width;
			this._elCanvas.height = htOption.height;
			el.appendChild(this._elCanvas);
			this._el = el;
			this._oContext = this._elCanvas.getContext("2d");
			this._bIsPainted = false;
			this._elImage = document.createElement("img");
			this._elImage.alt = "Scan me!";
			this._elImage.style.display = "none";
			this._el.appendChild(this._elImage);
			this._bSupportDataURI = null;
		};
			
		/**
		 * Draw the QRCode
		 * 
		 * @param {QRCode} oQRCode 
		 */
		Drawing.prototype.draw = function (oQRCode) {
            var _elImage = this._elImage;
            var _oContext = this._oContext;
            var _htOption = this._htOption;
            
			var nCount = oQRCode.getModuleCount();
			var nWidth = _htOption.width / nCount;
			var nHeight = _htOption.height / nCount;
			var nRoundedWidth = Math.round(nWidth);
			var nRoundedHeight = Math.round(nHeight);

			_elImage.style.display = "none";
			this.clear();
			
			for (var row = 0; row < nCount; row++) {
				for (var col = 0; col < nCount; col++) {
					var bIsDark = oQRCode.isDark(row, col);
					var nLeft = col * nWidth;
					var nTop = row * nHeight;
					_oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
					_oContext.lineWidth = 1;
					_oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;					
					_oContext.fillRect(nLeft, nTop, nWidth, nHeight);
					
					// ì•ˆí‹° ì•¨ë¦¬ì–´ì‹± ë°©ì§€ ì²˜ë¦¬
					_oContext.strokeRect(
						Math.floor(nLeft) + 0.5,
						Math.floor(nTop) + 0.5,
						nRoundedWidth,
						nRoundedHeight
					);
					
					_oContext.strokeRect(
						Math.ceil(nLeft) - 0.5,
						Math.ceil(nTop) - 0.5,
						nRoundedWidth,
						nRoundedHeight
					);
				}
			}
			
			this._bIsPainted = true;
		};
			
		/**
		 * Make the image from Canvas if the browser supports Data URI.
		 */
		Drawing.prototype.makeImage = function () {
			if (this._bIsPainted) {
				_safeSetDataURI.call(this, _onMakeImage);
			}
		};
			
		/**
		 * Return whether the QRCode is painted or not
		 * 
		 * @return {Boolean}
		 */
		Drawing.prototype.isPainted = function () {
			return this._bIsPainted;
		};
		
		/**
		 * Clear the QRCode
		 */
		Drawing.prototype.clear = function () {
			this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);
			this._bIsPainted = false;
		};
		
		/**
		 * @private
		 * @param {Number} nNumber
		 */
		Drawing.prototype.round = function (nNumber) {
			if (!nNumber) {
				return nNumber;
			}
			
			return Math.floor(nNumber * 1000) / 1000;
		};
		
		return Drawing;
	})();
	
	/**
	 * Get the type by string length
	 * 
	 * @private
	 * @param {String} sText
	 * @param {Number} nCorrectLevel
	 * @return {Number} type
	 */
	function _getTypeNumber(sText, nCorrectLevel) {			
		var nType = 1;
		var length = _getUTF8Length(sText);
		
		for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
			var nLimit = 0;
			
			switch (nCorrectLevel) {
				case QRErrorCorrectLevel.L :
					nLimit = QRCodeLimitLength[i][0];
					break;
				case QRErrorCorrectLevel.M :
					nLimit = QRCodeLimitLength[i][1];
					break;
				case QRErrorCorrectLevel.Q :
					nLimit = QRCodeLimitLength[i][2];
					break;
				case QRErrorCorrectLevel.H :
					nLimit = QRCodeLimitLength[i][3];
					break;
			}
			
			if (length <= nLimit) {
				break;
			} else {
				nType++;
			}
		}
		
		if (nType > QRCodeLimitLength.length) {
			throw new Error("Too long data");
		}
		
		return nType;
	}

	function _getUTF8Length(sText) {
		var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
		return replacedText.length + (replacedText.length != sText ? 3 : 0);
	}
	
	/**
	 * @class QRCode
	 * @constructor
	 * @example 
	 * new QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
	 *
	 * @example
	 * var oQRCode = new QRCode("test", {
	 *    text : "http://naver.com",
	 *    width : 128,
	 *    height : 128
	 * });
	 * 
	 * oQRCode.clear(); // Clear the QRCode.
	 * oQRCode.makeCode("http://map.naver.com"); // Re-create the QRCode.
	 *
	 * @param {HTMLElement|String} el target element or 'id' attribute of element.
	 * @param {Object|String} vOption
	 * @param {String} vOption.text QRCode link data
	 * @param {Number} [vOption.width=256]
	 * @param {Number} [vOption.height=256]
	 * @param {String} [vOption.colorDark="#000000"]
	 * @param {String} [vOption.colorLight="#ffffff"]
	 * @param {QRCode.CorrectLevel} [vOption.correctLevel=QRCode.CorrectLevel.H] [L|M|Q|H] 
	 */
	QRCode = function (el, vOption) {
		this._htOption = {
			width : 256, 
			height : 256,
			typeNumber : 4,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : QRErrorCorrectLevel.H
		};
		
		if (typeof vOption === 'string') {
			vOption	= {
				text : vOption
			};
		}
		
		// Overwrites options
		if (vOption) {
			for (var i in vOption) {
				this._htOption[i] = vOption[i];
			}
		}
		
		if (typeof el == "string") {
			el = document.getElementById(el);
		}

		if (this._htOption.useSVG) {
			Drawing = svgDrawer;
		}
		
		this._android = _getAndroid();
		this._el = el;
		this._oQRCode = null;
		this._oDrawing = new Drawing(this._el, this._htOption);
		
		if (this._htOption.text) {
			this.makeCode(this._htOption.text);	
		}
	};
	
	/**
	 * Make the QRCode
	 * 
	 * @param {String} sText link data
	 */
	QRCode.prototype.makeCode = function (sText) {
		this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
		this._oQRCode.addData(sText);
		this._oQRCode.make();
		this._el.title = sText;
		this._oDrawing.draw(this._oQRCode);			
		this.makeImage();
	};
	
	/**
	 * Make the Image from Canvas element
	 * - It occurs automatically
	 * - Android below 3 doesn't support Data-URI spec.
	 * 
	 * @private
	 */
	QRCode.prototype.makeImage = function () {
		if (typeof this._oDrawing.makeImage == "function" && (!this._android || this._android >= 3)) {
			this._oDrawing.makeImage();
		}
	};
	
	/**
	 * Clear the QRCode
	 */
	QRCode.prototype.clear = function () {
		this._oDrawing.clear();
	};
	
	/**
	 * @name QRCode.CorrectLevel
	 */
	QRCode.CorrectLevel = QRErrorCorrectLevel;
})();
;/**
 * Created by andrewkimoto on 1/04/16.
 */

Autodesk.Nano = Autodesk.Nano || {};


Autodesk.Nano.Loader = function(app) {
    //Autodesk.Nano.Private = Autodesk.Nano.Private || {};
    window.Loader = this;
    this.app = app;
};

Autodesk.Nano.Loader.prototype.loadViewData = function loadViewData(options) {
    var options = options;
    var _that = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://d2gqcyogkbv0l5.cloudfront.net/cdd0cfb/nanocore/config/mol-topviews.json', true);
    xhr.setRequestHeader("Connection-ID", this.getConnectionID());
    xhr.onload = function(e) {
        if (xhr.status === 200) {
            Autodesk.Nano.topViewData = JSON.parse(xhr.responseText);
            _that.initializeViewer(options);

            if (isTouchDevice()) {
                document.body.className += "mobile";
                _that.app.container.querySelector('#guiviewer3d-toolbar').classList.add('hide-on-mobile');
            }
            if (_that.options.topViews === 'presentation') {
                _that.app.container.querySelector('#selTools').classList.add('hidden');
            }
        } else {
            console.error('failed',e);
        }
    };
    xhr.send();

};

Autodesk.Nano.Loader.prototype.initializeViewer = function initializeViewer(options) {
    avp.initializeLocalization();

    var svfURL = options.svf;
    var documentId = options.documentId;

    if (svfURL && svfURL.indexOf("urn:") === -1) {
        // Load local svf file.
        options.env = "Local";
        Autodesk.Nano.Initializer(options, this.initViewerCB(viewer,options));
    } else if (svfURL && svfURL.indexOf("urn:") === 0) {
        // Load remote svf file through viewing service.
        Autodesk.Nano.Initializer(options, function(){viewer.start();viewer.load(svfURL);});
    } else if (documentId && documentId.indexOf("urn:") === -1) {
        // Load local document.
        viewer.start();
        loadDocument(viewer, documentId, options.initialItemId);
        viewer.setQualityLevel(false, true);

    } else {
        // Load document through viewing service. Use a default document
        // if the document is not explicitly specified.
        if(!documentId)
        // This is the v8 engine model.
            documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOlZpZXdpbmdTZXJ2aWNlVGVzdEFwcC91c2Vycy9NaWNoYWVsX0hhbmAvRW5naW5lLmR3Zg";

        // Lambo from Jean-Luc!
        // documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOlZpZXdpbmdTZXJ2aWNlVGVzdEFwcC91c2Vycy9NaWNoYWVsX0hhbmAvQVZFTlRBRE9SIExQNzAwLmYzZA";
        Autodesk.Nano.Initializer(options, function(){ viewer.start();
            loadDocument(viewer, documentId, options.initialItemId);});
    }
};

Autodesk.Nano.Loader.prototype.autoStartVR = function autoStartVR(viewer) {
    if (Autodesk.Viewing.isIOSDevice()) {
        this.viewManager.getTopView('BrowserView').startVR();
    } else {
        this.viewManager.createTopView('AutoVRView');
        this.viewManager.getTopView('AutoVRView').show();
    }
    viewer.removeEventListener(Autodesk.Nano.SESSION_SAVED_EVENT,this.autoStartVRBind);
};

Autodesk.Nano.Loader.prototype.initViewerCB = function initViewerCB(viewer,options) {
    this.options = options;
    var self = this;
    if (options.headless) {
        viewer.start();
    } else {   // using UI
        this.autoStartVRBind = this.autoStartVR.bind(this,viewer);
        //set up vr autostart
        if (this.options.config3d.autoVR === true && Autodesk.Viewing.isPhone()) {
            viewer.addEventListener(Autodesk.Nano.SESSION_SAVED_EVENT, this.autoStartVRBind);
        }

        this.loadTopViews(viewer,options);
        viewer.start();

        this.closeStatusView = function () {
            self.app.Loader.isLoading = false; // loading is done at this point
            self.viewManager.getTopView('StatusView').hide();
        };

        viewer.addEventListener(Autodesk.Nano.SESSION_SAVED_EVENT, this.closeStatusView);
    }


    viewer.setQualityLevel(false, true);

    if (options.config3d && options.config3d.autocamDuration) {
        viewer.autocam.shotParams.duration = options.config3d.autocamDuration;
    }

    if (options.config3d && options.config3d.autocamDestinationPercent) {
        viewer.autocam.shotParams.destinationPercent = options.config3d.autocamDestinationPercent;
    }

    //don't load session for headless
    if(!options.headless) {
        viewer.app.MolMan.loadSession(this.sessionID);
    } else {
        viewer.app.The3DNanoMan = null;
    }

};

Autodesk.Nano.Loader.prototype.loadViewsFromManifest = function loadViewsFromManifest(viewer,svfName) {
    this.viewManager = typeof ViewManager === 'object' ? ViewManager : this.app.ViewManager;
    var manifest = this.viewManager.topViewManifest,
        view,
        div,
        parentElement,
        appID = this.app.appID,
        args = {viewer: viewer, svfName: svfName};

    for (view in manifest) {
        if(manifest.hasOwnProperty(view)) {
            if(manifest[view].type === 'topView') { //add a view
                this.viewManager.createTopView(manifest[view].name,args);
            } else if (manifest[view].type === 'div') { // add a div
                div = document.createElement('div');
                if(manifest[view].id) {
                    div.setAttribute('id',manifest[view].id + '-' + appID);
                    div.setAttribute('class',manifest[view].id);
                }
                if(manifest[view].name) {
                    div.setAttribute('name',manifest[view].name);
                }
                if(manifest[view].class) {
                    div.setAttribute('class',manifest[view].id);
                }
                if(manifest[view].parentElement) {
                    parentElement = document.querySelector(manifest[view].parentElement + '-' + appID);
                } else {
                    parentElement = document.body;
                }
                parentElement.appendChild(div);

            }
        }
    }
};

Autodesk.Nano.Loader.prototype.loadTopViews = function loadTopViews(viewer,options) {
    Autodesk.Nano.BROWSER_RESIZED_EVENT = 'browserResized';
    this.viewManager = typeof ViewManager === 'object' ? ViewManager : this.app.ViewManager;
    var args={};
    var topView;
    var svfURL = options.svf;
    var svfName = svfURL.split('/')[svfURL.split('/').length-1].replace(/\.svf/,'');
    this.loadViewsFromManifest(viewer,svfName); //load the top views from the manifest
    this.loadRootView(viewer,options.svf);

    // Check if startup cookie to determine if to load SplashView


    var startUpCheck = this.getCookieItem('startUp');
    if (startUpCheck !== 'hide') {
        if (!options.config3d.noSplash) {
            this.viewManager.createTopView('SplashView');
            this.viewManager.getTopView('SplashView').show();
        }
    }

    //below was being called before viewer impl was defined.
    //TODO set viewer size manually or set via event
    //Autodesk.Nano.MolViewer.ViewManager2D._instance.setViewerSize();

    viewer.fireEvent(Autodesk.Viewing.INSPECTOR_LOADED);

    //handler for resizing of window -- updates heights of browser views and scrollbars
    window.addEventListener('resize', this.resizeHandler.bind(this));

    if(options.configViews) {
        this.viewManager.setViewState(options.configViews);
    }
};

Autodesk.Nano.Loader.prototype.loadRootView = function loadRootView(viewer,svf) {
    // We don't load the root view when the model is not loaded
    if(svf !== '') {
        this.viewManager.addView(ViewManager.getRootView(),{viewer: viewer, upstreamView: null, upstreamElement: null},true); // add root level view in root level panel
    }
};

Autodesk.Nano.Loader.prototype.resizeHandler = function resizeHandler() {
    var topViews = this.viewManager.topViews;
    var view;
    for (view in topViews) {
        if(topViews.hasOwnProperty(view)) {
            if(topViews[view].scrollbar) {
                this.updatePanelHeight(topViews[view]);
            }
        }
    }
};

Autodesk.Nano.Loader.prototype.updatePanelHeight = function updatePanelHeight(view) {
    if(view.setWrapperHeight) {
        view.setWrapperHeight();
    }
    view.scrollbar.resetScrollbar();
};

Autodesk.Nano.Loader.prototype.getOptionsFromQueryString = function getOptionsFromQueryString() {
    var config3d = {};
    var pdbId ='';
    var svfURL = '';
    var protocol = location.protocol;
    var showViewCube = avp.getParameterByName('viewcube')!== 'false';
    var hideBrowser = avp.getParameterByName('hB');
    var hideInspector = avp.getParameterByName('hI');
    var hideHeader = avp.getParameterByName('hH');
    var disableBrowser = avp.getParameterByName('dB');
    var disableInspector = avp.getParameterByName('dI');
    var explodeScale = avp.getParameterByName('explodeScale');
    var noSplash = avp.getParameterByName('nosplash') === 'true';
    var viewerMode = avp.getParameterByName('viewerMode');
    var sessionId = avp.getParameterByName('session');
    var canvasConfig = avp.getParameterByName("canvasConfig");
    if (canvasConfig) {
        config3d.canvasConfig = JSON.parse(canvasConfig);
    }

    var docStructureConfig = avp.getParameterByName("docConfig");
    if (docStructureConfig) {
        config3d.docStructureConfig = JSON.parse(docStructureConfig);
    }

    var documentId = avp.getParameterByName("document");
    if(!documentId) {
        documentId = avp.getDemoDocumentURN();
    }

    var initialItemId = avp.getParameterByName("item");

    var isolateObjectId = avp.getParameterByName("object");

    var extensions = config3d['extensions'] || [];
    //extensions.push('Autodesk.Fusion360.Animation');
    //extensions.push('Autodesk.Nano.Oculus');
    extensions.push('Autodesk.Nano.Collaboration');
    extensions.push('Autodesk.Nano.RemoteControl');
    //extensions.push("Autodesk.Measure");
    config3d.extensions = extensions;
    config3d.explodeScale = explodeScale;
    config3d.showViewCube = showViewCube;
    config3d.hideBrowser = hideBrowser === 'true';
    config3d.hideInspector = hideInspector === 'true';
    config3d.hideHeader = hideHeader === 'true';
    config3d.disableBrowser = disableBrowser === 'true';
    config3d.disableInspector = disableInspector === 'true';
    config3d.viewerMode = viewerMode;
    config3d.noSplash = noSplash;

    // Use this option to hide the RTC button in viewer toolbar
    /*
     config3d.rtc = {};
     config3d.rtc.disableRTCToolbarButton = true;
     */

    svfURL = avp.getParameterByName("svf");
    if(!avp.getParameterByName("svf")) {
        pdbId = this.getCookieItem('pdbId');
        //use default pdbId if no svf parameter and no cookie set
        pdbId = pdbId ? pdbId : '1C7D';
        svfURL = (LMVSERVER_HOST.substr(0,7) !== 'http://' ? protocol + '//' : '') + LMVSERVER_HOST + '/structures/' + pdbId + '/' + pdbId +'.svf';
    }
    var documentId = avp.getParameterByName("document");
    var initialItemId = avp.getParameterByName("item");
    var isolateObjectId = avp.getParameterByName("object");
    var offline = avp.getParameterByName("offline");

    // Test accessToken callbacks.
    function getAccessToken(onGetAccessToken) {
        var token = "VZ/w+AvqmpAKSwOFzDKMU7J3B8s=";
        onGetAccessToken(token, 30);
    }

    return {
        env: avp.getParameterByName("env") || "Local",
        config3d : config3d,
        documentId: documentId,
        sessionId: sessionId,
        svf: svfURL,
        initialItemId: initialItemId,
        isolateObjectId: isolateObjectId,
        userInfo : {
            name : "Joe Programmer"
        },
        libraryName: "src/globalinit.js",
        offline: offline
    };
};

Autodesk.Nano.Loader.prototype.getCookieItem = function getCookieItem(sKey) {
    if (!sKey) {
      return null;
    }
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" +
           encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
           "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
};

// This generates the unique connectionID which needs to be added to all calls the
// tirrenu server api; the connectionID is used to ensure that all api calls made by the
// app route to the same server via the load balancer.
Autodesk.Nano.Loader.prototype.setConnectionID = function setConnectionID() {
    this.connectionID = THREE.Math.generateUUID();
};

Autodesk.Nano.Loader.prototype.getConnectionID = function getConnectionID() {
    return this.connectionID;
};


Autodesk.Nano.Loader.prototype.addStyleSheet = function addStyleSheet(name) {
    var sheet = document.querySelector('#'+name);
    if(sheet) {
        return;
    }
    var head  = document.querySelector('head');
    var link  = document.createElement('link');
    link.id   = name;
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://d2gqcyogkbv0l5.cloudfront.net/cdd0cfb/molviewer/res/' +  name + '.css';
    link.media = 'all';
    head.appendChild(link);
};



;// set up namespace...
Autodesk.Nano = Autodesk.Nano || {};

/**
 * constructor for MetaData
 * @param {object} viewer - the 3DViewer object.
 */
Autodesk.Nano.MetaData = function(viewer) {
    var time = Date.now();
    this.subTitle = '';
    //initialize the search arrays as properties so that they will be externally accessible


    this._loadMetaData(viewer); //create the metaData array

    //call methods to create the populate the search array properties initialized above
    //example:  this.searchArray1 = Autodesk.Nano.Metadata._buildSearchArray1();

    console.log(Date.now() - time+' ms to build arrays');
}; // end constructor


/**
 * Builds an array of atomic data objects
 * @param {object} viewer - the 3DViewer object.
 */
Autodesk.Nano.MetaData.prototype._loadMetaData = function _loadMetaData(viewer) {
    var model;
    if (!viewer) {
        return false;
    }
    model = viewer.model;

    //here we would set up properties from our data source

    this.metaData = null; // this would be the original array containing all the information
    return true;
};


/**
 * Returns a unique array of items.
 * @param {object} inputArray - the array to be uniqued
 * @param {number} uniqueColumn - optional column to be returned.  If this is omitted
 * we assume that the array is 1-dimensional
 * @returns {object} uniqueItems - unique array of items
 * Usage: this.getUniqueItems(this.chains)  returns unique chain ids
 * Usage: this.getUniqueItems(this.metaArray,3) returns unique contents of column 3 (atoms)
 * For the metaArray, column 0 = chain, column 1 = residue ID, column 2 = residue, column 3 = atom, column 4 = B-factor
 */
Autodesk.Nano.MetaData.prototype.getUniqueItems = function getUniqueItems(inputArray,uniqueColumn) {
    var i,
        item,
        oItems = {},
        uniqueItems = [],
        arrayLength = inputArray.length;

    if (!inputArray) {
        return false;
    }

    if (uniqueColumn) {
        for (i = 0; i < arrayLength; i++) {
            oItems[inputArray[i][uniqueColumn]] = true;
        }
    } else {
        for (i = 0; i < arrayLength; i++) {
            oItems[inputArray[i]] = true;
        }
    }

    for (item in oItems) {
        if(oItems.hasOwnProperty(item)) {
            uniqueItems.push(item);
        }
    }
    return uniqueItems;
};


/** Returns a unique array of items.  Each row can contain an array of two values
 *
 * @param {object} inputArray - the array to be uniqued
 * @param {number} uniqueColumn - optional column to be returned.  If this is omitted
 * we assume that the array is 1-dimensional
 * @param {number} displayColumn - optional column to be returned with uniqueColumn.
 * This is used in cases where you need a value as well as a display item (say id and name)
 * @returns {object} uniqueItems - unique array of items
 * Usage this.getUniqueItemsWithDisplay(myArray,1,2) returns an array each row of which contains
 * a unique value from column 1 of myArray and a (non-unique) value from column 2 of myArray
 */
Autodesk.Nano.MetaData.prototype.getUniqueItemsWithDisplay = function getUniqueItemsWithDisplay(inputArray,uniqueColumn,displayColumn) {
    var i,
        item,
        oItems = {},
        uniqueItems = [],
        arrayLength = inputArray.length;

    if (!inputArray) {
        return false;
    }
    for (i = 0; i < arrayLength; i++) {
        oItems[inputArray[i][uniqueColumn]] = inputArray[i][displayColumn];
    }
    for (item in oItems) {
        if (oItems.hasOwnProperty(item)) {
            uniqueItems.push([item,oItems[item]]);
        }
    }
    return uniqueItems;
};


Autodesk.Nano.MetaData.prototype.findItems = function findItems(type,searchArray) {
    var self = this,
        item,
        items = [],
        i,
        len;
    if (typeof searchArray[0] === 'object') {  //array of arrays
        len = searchArray.length;
        for (i = 0; i < len; i++) {
            item = searchArray[i].map(function(obj) {return self.mapItems(obj,type);});
            items = items.concat(item);
        }
    } else {
        items = searchArray.map(function(obj) { return self.mapItems(obj,type); });
    }
    return this.getUniqueItems(items,0);
};

/**
 * performs an intersection of 2 or more arrays.
 * @param {Array} [arguments] - arrays are passed as arguments
 * @returns {object} ret - an array of atom ids (i.e. metaData row numbers)
 * Usage: this.intersectArrays(myArray1,myArray2,...,myArrayN) returns the intersection of all arrays
 */
Autodesk.Nano.MetaData.prototype.intersectArrays = function intersectArrays() {
    //note: arrays are passed as arguments
    var i,
        j,
        elem,
        shortest,
        nShortest,
        n,
        len,
        ret = [],
        obj={},
        nOthers;
    nOthers = arguments.length - 1;
    nShortest = arguments[0].length;
    shortest = 0;
    for (i = 0; i <= nOthers; i ++) {
        n = arguments[i].length;
        if (n < nShortest) {
            shortest = i;
            nShortest = n;
        }
    }

    for (i = 0; i <= nOthers; i++) {
        n = (i === shortest) ? 0 : (i || shortest); //Read the shortest array first. Read the first array instead of the shortest
        len = arguments[n].length;
        for (j = 0; j < len; j++) {
            elem = arguments[n][j];
            if (obj[elem] === i - 1) {
                if (i === nOthers) {
                    ret.push(elem);
                    obj[elem] = 0;
                } else {
                    obj[elem] = i;
                }
            } else if (i === 0) {
                obj[elem] = 0;
            }
        }
    }
    return ret;
};


/**
 * performs an unique union of 2 or more arrays.
 * @param {Array} [arguments] - arrays are passed as arguments
 * @returns {object} aResults - an array of atom ids (i.e. metaData row numbers)
 * Usage: this.unionArrays(myArray1,myArray2,...,myArranN) returns unique union of all arrays passed
 */
Autodesk.Nano.MetaData.prototype.unionArrays = function unionArrays() {
    // note: arrays are passed in as arguments
    var i,
        result,
        oResults = {},
        aResults = [],
        aConcat = [].concat.apply([],arguments);
    var len = aConcat.length;

    for (i = 0; i < len; i++) {
        oResults[aConcat[i]] = true;
    }

    for (result in oResults) {
        if (oResults.hasOwnProperty(result)) {
            aResults.push(result);
        }
    }
    return aResults;
};

Autodesk.Nano.MetaData.prototype.countKeys = function countKeys(object) {
    var i = 0,
        key;
    for(key in object) {
        if(object.hasOwnProperty(key)) {
            i += 1;
        }
    }
    return i;
};;/**
 * Created by andrewkimoto on 6/8/16.
 */
Autodesk.Nano.StateManager = function stateManager(app) {
    this.app = app;
    this.molMan = app.MolMan;
    this.molViewer = app.MolViewer;
    this._initializeEvents();
};

Autodesk.Nano.StateManager.prototype.getSnapshot = function getSnapshot() {
    var state = JSON.stringify(this.molViewer.getMolViewerState());
    var compressedState = LZString144.compressToEncodedURIComponent(state);
    return compressedState;
};

Autodesk.Nano.StateManager.prototype.restoreSnapshot = function restoreSnapshot(compressedState) {
    var stateString,
        stateObj;
    if(!compressedState) {
        return;
    }
    //reset camera diff for VR  at the beginning of change
    var context = this.app.MoleculeViewer.impl.renderer();
    var camera = this.app.MoleculeViewer.impl.camera;
    if (context && context.activateOrbitView) {
        context.activateOrbitView(true, camera);
    }

    stateString = LZString144.decompressFromEncodedURIComponent((compressedState));
    stateObj = JSON.parse(stateString);
    this.molMan.fromJSONObj(stateObj);
    // Add callback to autocam animation so that saved pivot point is set after
    // animation finishes
    this.app.MoleculeViewer.autocam.setAnimationEndCallback(this.updatePivotPoint.bind(this,{state: stateObj}));
};

Autodesk.Nano.StateManager.prototype.restoreStateButtons = function restoreStateButtons(buttonData) {
    this.app.ViewManager.getTopView('StateView').restoreStateButtons(buttonData);
};

Autodesk.Nano.StateManager.prototype._initializeEvents = function _initializeEvents() {
    var self = this;

    this.updatePivotPoint = function updatePivotPoint(event) {
        // Here we reset the pivot point from the viewpoint.pivot array.
        // Currently ViewerState.restoreState does not do this so we are
        // doing it here.
        var pivotArray = event.state.viewport.pivotPoint;
        var pivotPoint = new THREE.Vector3(pivotArray[0],pivotArray[1],pivotArray[2]);
        self.app.MoleculeViewer.navigation.setPivotPoint(pivotPoint);
        self.app.MoleculeViewer.autocam.setAnimationEndCallback(null);
        var context = self.app.MoleculeViewer.impl.renderer();
        var camera = self.app.MoleculeViewer.impl.camera;
        if (context && context.activateOrbitView) {
            context.activateOrbitView(true, camera);
        }
    };
};

;// The parent view of all top level views
// only  used as prototype of other views
Autodesk = Autodesk || {};
Autodesk.Viewing = Autodesk.Viewing || {};
Autodesk.Nano = Autodesk.Nano || {};
Autodesk.Nano = Autodesk.Nano || {};

Autodesk.Nano.TopView = function (args) {
    this.app = args.app;

    this._initializeElements();
};

//destructor
Autodesk.Nano.TopView.prototype.destroy = function destroy() {
    var parentNode = this.el.parentNode;
    this._unbindEvents();
    if(parentNode) {
        parentNode.removeChild(this.el);
    }
    this.app.ViewManager.unRegisterView(this);
    this.app.MoleculeViewer.fireEvent({type: Autodesk.Viewing.BROWSER_RESIZED_EVENT});
};

Autodesk.Nano.TopView.prototype._initializeElements = function _initializeElements() {
    //initialize el but do not add it to the parent
    this.el = document.createElement('div');
    this.el.setAttribute('style','');
    this.el.setAttribute('class','topview');
};

Autodesk.Nano.TopView.prototype.getWidth = function getWidth() {
    return this.el.style.width;
};


Autodesk.Nano.TopView.prototype.getHeight = function getHeight() {
    return this.el.style.height;
};


Autodesk.Nano.TopView.prototype.setWidth = function setWidth(width) {
    this.el.style.width = width + 'px';

};


Autodesk.Nano.TopView.prototype.setHeight = function setHeight(height) {
    this.el.style.height = height + 'px';
};


Autodesk.Nano.TopView.prototype.show = function show() {
    var isSafari = navigator.userAgent.toLowerCase().match(/safari/);
    if(this.displayType === 'flex') {
        if(isSafari) {
            this.el.style.display = '-webkit-flex';
        } else {
            this.el.style.display = 'flex';
        }
    } else {
        this.el.style.display = 'block';
    }
    this.visible = true;
};


Autodesk.Nano.TopView.prototype.hide = function hide() {
    this.el.style.display = 'none';
    this.visible = false;
};

Autodesk.Nano.TopView.prototype.updateViewer = function updateViewer(viewer) {
    this.viewer = viewer;
    this._bindEvents();
};

Autodesk.Nano.TopView.prototype._bindEvents = function _bindEvents() {
    //no op function called by updateViewer.  To be overridden as needed
    // by objects down the prototype chain.
};

Autodesk.Nano.TopView.prototype._unBindEvents = function _unBindEvents() {
    //no op function called by updateViewer.  To be overridden as needed
    // by objects down the prototype chain.
};


//destroy all children
Autodesk.Nano.TopView.prototype.destroyChildViews = function destroyChildViews(obj,isView) {
    var children = this.app.ViewManager.getChildViews(obj,isView),
        i;

    for (i = 0; i < children.length; i++) {
        this.app.ViewManager.destroyView(children[i]);
    }
};


Autodesk.Nano.TopView.prototype.toggleChildView = function toggleChildView(view,event) {
    if (this.app.ViewManager.hasChildView(view, event.target)) {
        this.app.ViewManager.destroyView(view,event.target, false);
        event.target.parentNode.classList.remove('open');
    } else {
        view.addView(view,event);
        event.target.parentNode.classList.add('open');
    }
};

Autodesk.Nano.TopView.prototype.addView = function addView(view,event) {
    return this.app.ViewManager.addView(this.app.ViewManager.getDownstreamView(view.viewType),{viewer: this.viewer, upstreamView: view, upstreamElement: event.target},true);
};

// Mobile related functions
Autodesk.Nano.TopView.prototype.openView = function openView(view, event) {
    if (!this.app.ViewManager.hasChildView(view, event.target)) {
        return this.app.ViewManager.addView(this.app.ViewManager.getDownstreamView(view.viewType),{viewer: this.viewer, upstreamView: view, upstreamElement: event.target},true);
    }
};

Autodesk.Nano.TopView.prototype.destroyView = function destroyView(viewId) {
    this.app.ViewManager.destroyView(this.app.ViewManager.viewRegistry[viewId], null, true);
};

Autodesk.Nano.TopView.prototype.toggleDownstreamPanel = function toggleDownstreamPanel(panelView) {

    var topViewData = this.app.ViewManager.topViewData;
    this.app.ViewManager.topViews[panelView].el.classList.toggle("hide");
    this.app.ViewManager.topViews[topViewData[panelView].downstreamPanel].el.classList.toggle("show");
};

Autodesk.Nano.TopView.prototype.toggleUpstreamPanel = function toggleUpstreamPanel(panelView) {
    var topViewData = this.app.ViewManager.topViewData;

    // Back button leading out of the mobile browse mode
    if (topViewData[panelView].upstreamPanel === null) {
        this.app.container.querySelector('.mol-menu-container').classList.remove('full-width');
        this.app.container.getElementById('browser').classList.toggle('active');
        return;
    }
    this.app.ViewManager.topViews[panelView].el.classList.toggle("show");
    this.app.ViewManager.topViews[topViewData[panelView].upstreamPanel].el.classList.toggle("hide");
};

Autodesk.Nano.TopView.prototype.createFileLoader = function createFileLoader(name,id,accept,callback,args) {
    var fileElement = document.body.querySelector('#' + id);
    var event = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true
    });

    if(fileElement) {
        document.body.removeChild(fileElement);
    }

    fileElement = document.createElement('input');
    fileElement.setAttribute('type', 'file');
    fileElement.setAttribute('class', 'file-hidden');
    fileElement.setAttribute('accept', accept);
    fileElement.setAttribute('id', id);
    fileElement.setAttribute('name', name);
    fileElement.style.opacity = 0;
    fileElement.addEventListener('change', function() {callback(args);});
    //fileElement.addEventListener('change', callback(args,this));
    document.body.appendChild(fileElement);
    fileElement.dispatchEvent(event);
};;Autodesk.Nano.DialogView = function (args) {

    var me = Autodesk.Nano.DialogView.prototype;
    this.app = args.app;
    this.viewer = args.viewer;
    this.type = 'DialogView';
    this.activeDialog = null;  // we set this to refer to the currently open dialog
    this.parentElement = document.querySelector(args.parentElement);
    this.isSafari = navigator.userAgent.toLowerCase().match(/safari/);

    this._initialize();
};

Autodesk.Nano.DialogView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.DialogView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.DialogView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.DialogView.prototype.destructor = function destructor() {
    this.el.innerHTML = '';
    this.el.remove();
    this.app.ViewManager.destroyTopView(this);
    //no events yet so nothing to unbind.
};

Autodesk.Nano.DialogView.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('DIV');
    this.el.setAttribute('id','dialogLayer');
    this.el.setAttribute('class','hidden');
    this.dialogDiv = document.createElement('div');
    this.dialogDiv.setAttribute('id','dialogDiv');
    this.dialogDiv.style.pointerEvents = 'all';
    this.el.appendChild(this.dialogDiv);
    this.parentElement.appendChild(this.el);
};

Autodesk.Nano.DialogView.prototype._initializeEvents = function _initializeEvents() {

    var self = this;



};

Autodesk.Nano.DialogView.prototype.show = function show() {
    this.el.classList.remove('hidden');
};

Autodesk.Nano.DialogView.prototype.hide = function hide() {
    this.el.classList.add('hidden');
};

Autodesk.Nano.DialogView.prototype.setDimensions = function setDimensions(h,w, fullScreen, percent, applyToContainer) {
    if(!h || !w) {
        return;
    }
    if(fullScreen === null) {
        fullScreen = false;
    }

    if(percent === null) {
        percent = false;
    }

    var element = this.dialogDiv;
    if(applyToContainer) {
        element = this.el;
    }

    if(percent) {
        element.style.height = h + '%';
        element.style.width = w + '%';
    } else {
        element.style.height = h + 'px';
        element.style.width = w + 'px';
    }

};

// Sets the orientation to #dialogLayer div
// Empty string means orientation === 0
// Orientation Mode is the orientation which is forced on the dialog
Autodesk.Nano.DialogView.prototype.setOrientation = function setOrientation(orientationMode, orientationValue) {
    if (orientationMode === "portrait") {
        if (orientationValue > 0) {
            this.el.classList.add('left');
        } else if (orientationValue < 0) {
            this.el.classList.add('right');
        } else {
            this.el.classList.remove('left');
            this.el.classList.remove('right');
        }
    } else {
        if (orientationValue !== 0) {
            this.el.classList.remove('left');
        } else {
            this.el.classList.add('left');
        }
    }

};

// Orientation only affects when the dialog is fullscreen
Autodesk.Nano.DialogView.prototype.setPosition = function setPosition(fullScreen, orientation) {

    if (fullScreen) {
        if ((orientation === null) || (orientation === 0) || (orientation < 0)) {
            this.dialogDiv.style.top = 0 + 'px';
            this.dialogDiv.style.left = 0 + 'px';

            this.dialogDiv.style.bottom = null;
            this.dialogDiv.style.right = null;
        } else if (orientation > 0) {
            this.dialogDiv.style.bottom = 0 + 'px';
            this.dialogDiv.style.right = 0 + 'px';

            this.dialogDiv.style.top = null;
            this.dialogDiv.style.left = null;
        }
    } else {
        var heightOffset = parseInt(this.dialogDiv.style.height)/2;
        var widthOffset = parseInt(this.dialogDiv.style.width)/2;

        this.dialogDiv.style.top = 'calc(50% - ' + heightOffset + 'px)';
        this.dialogDiv.style.left = 'calc(50% - ' + widthOffset + 'px)';
    }

};

Autodesk.Nano.DialogView.prototype.setCustomPosition = function setCustomPosition(top, right, bottom, left) {
    this.dialogDiv.style.top = (top ? top + 'px' : 'initial');
    this.dialogDiv.style.left = (left ? left + 'px' : 'initial');
    this.dialogDiv.style.bottom = (bottom ? bottom + 'px' : 'initial');
    this.dialogDiv.style.right = (right ? right + 'px' : 'initial');
};

Autodesk.Nano.DialogView.prototype.setVerticalScroll = function setVerticalScroll(scroll) {
    if(scroll) {
        this.dialogDiv.style.overflowY = 'scroll';
    } else {
        this.dialogDiv.style.overFlowY = 'hidden';
    }

};

Autodesk.Nano.DialogView.prototype.setOverflow = function setOverflow(overflow) {
    if(overflow) {
        this.dialogDiv.style.overFlowY = 'visible';
        this.dialogDiv.style.overFlowX = 'visible';
        this.dialogDiv.style.overflow = 'visible';
    } else {
        this.dialogDiv.style.overFlowY = 'hidden';
        this.dialogDiv.style.overFlowX = 'hidden';
        this.dialogDiv.style.overflow = 'hidden';
    }
};

Autodesk.Nano.DialogView.prototype.setModal = function setModal() {
    this.el.style.pointerEvents = 'all';
};

Autodesk.Nano.DialogView.prototype.setModeless = function setModeless() {
    this.el.style.pointerEvents = 'none';
};;/**
 * Created by andrewkimoto on 6/9/16.
 */
Autodesk.Nano.GalleryStateButton = function (id,parentElement,enumerator,parentView,name,active, stateString) {

    var me = Autodesk.Nano.GalleryStateButton.prototype;
    this.id = id;
    this.name = name;
    this.active = active ? true : false;
    this.enumerator = enumerator;
    this.parentElement = parentElement;
    this.parentView = parentView;
    this.app = parentView.app;
    this.stateString = stateString;
    this._initialize();
};

Autodesk.Nano.GalleryStateButton.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.GalleryStateButton.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.GalleryStateButton.prototype.destructor = function destructor() {
    this.el.innerHTML = '';
    this.el.remove();
};

Autodesk.Nano.GalleryStateButton.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('div');
    this.el.setAttribute('id','state-'+ this.id);
    this.el.setAttribute('class','gallery-state-button');
    if (this.active) {
        this.el.classList.add('active');
    }
    this.text = document.createElement('div');
    this.text.setAttribute('class','gallery-state-text');
    if (this.name) {
        this.text.innerHTML = this.name;
    }


    this.el.appendChild(this.text);
    this.parentElement.appendChild(this.el);
};

Autodesk.Nano.GalleryStateButton.prototype._initializeEvents = function _initializeEvents() {
    var self = this;

    this.setActive = function setActive(active) {
        self.active = active;
        if(active) {
            self.el.classList.add('active');
        } else {
            self.el.classList.remove('active');
        }
    };

    this.loadState = function loadState() {
        this.parentView.updateStatusViewPosition();
        var sv = this.app.ViewManager.getTopView('StatusView');
        sv.showCustomMessage('Loading Snapshot...');
        window.setTimeout(function() { // give browser time to show StatusView
            this.app.StateManager.restoreSnapshot(self.stateString);
            self.parentView.deselectStateButtons();
            self.setActive(true);
            sv.hide();
        },100);

    };



    this.resetButton = function resetButton() {
        self.el.style.backgroundColor = '';
        self.updateButton.innerHTML = 'update';
    };

    this.loadStateBind = this.loadState.bind(this);

    this.el.addEventListener('click', this.loadStateBind);
};

;/**
 * Created by andrewkimoto on 6/8/16.
 */

Autodesk.Nano.GalleryStateView = function (args) {

    var me = Autodesk.Nano.GalleryStateView.prototype;
    this.app = args.app;
    this.viewer = args.viewer;
    this.type = 'StateView';
    this.displayType = 'flex';
    this.parentElement = this.app.container.querySelector(args.parentElement);
    this.stateButtons = [];
    this.nextButton = 1;
    this._initialize();
};

Autodesk.Nano.GalleryStateView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.GalleryStateView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.GalleryStateView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.GalleryStateView.prototype.destructor = function destructor() {
    this.el.innerHTML = '';
    this.el.remove();
    this.app.ViewManager.destroyTopView(this);
};

Autodesk.Nano.GalleryStateView.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('DIV');
    this.el.setAttribute('id','galleryStatePanel');
    this.el.style.display = 'none';
    this.parentElement.appendChild(this.el);
    this.show();
};



Autodesk.Nano.GalleryStateView.prototype._initializeEvents = function _initializeEvents() {
    var self = this;

    this.removeStateButtonsBind = this.removeStateButtons.bind(this);

    this._bindEvents = function _bindEvents() {
        self.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self.removeStateButtonsBind);

    };

    this._unbindEvents = function _unbindEvents() {
        self.viewer.removeEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self.removeStateButtonsBind);
    };

    this.updateStatusViewPosition = function updateStatusViewPosition() {
        self.el.nextSibling.style.bottom = self.el.clientHeight+'px';
    };

    //changes position of statusview based on height of the gallerystateview
    window.addEventListener('resize', this.updateStatusViewPosition);
    this.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, this.removeStateButtonsBind);
    this.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, this.removeStateButtonsBind);
};




Autodesk.Nano.GalleryStateView.prototype.addStateButton = function addStateButton(id, name, stateString, active, buttonCount, restored) {
    var stateButton = new Autodesk.Nano.GalleryStateButton(id,this.el,this.nextButton,this, name, active, stateString);
    this.stateButtons.push(stateButton);
    this.nextButton += 1;
    if(!restored) {
        this.deselectStateButtons();
        stateButton.text.focus();
        stateButton.text.select();
        stateButton.setActive(true);
    }
    if(buttonCount) {
        stateButton.el.style.width = (100/buttonCount) +'%';
        if(this.nextButton === buttonCount + 1) {
            stateButton.el.classList.add('right');
        }
    }

};

Autodesk.Nano.GalleryStateView.prototype.removeStateButton = function removeStateButton(id) {
    var stateButtonInfo = this.getStateButtonInfo(id);
    if (stateButtonInfo) {
        stateButtonInfo.button.destructor();
        this.stateButtons.splice(stateButtonInfo.index,1);
        //delete this.stateButtons[id];
        if (this.stateButtons.length === 0) { //no more stateButtons
            this.el.classList.remove('active');
        }

    }
};


Autodesk.Nano.GalleryStateView.prototype.deselectStateButtons = function deselectStateButtons() {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        this.stateButtons[i].active = false;
        this.stateButtons[i].el.classList.remove('active');
    }
};

//find the stateButton in the array, return the button and its index
//as an object
Autodesk.Nano.GalleryStateView.prototype.getStateButtonInfo = function getStateButtonInfo(id) {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        if (this.stateButtons[i].id === id) {

            return {button: this.stateButtons[i], index: i};
        }
    }
    return false; //not found
};

//restore buttons from button array
Autodesk.Nano.GalleryStateView.prototype.restoreStateButtons = function restoreStateButtons(buttonData) {
    var i,
        button;
    // remove existing buttons
    if (this.stateButtons.length > 0) {
        this.removeStateButtons();
    }

    for (i = 0; i < buttonData.length; ++i) {
        button = this.addStateButton(buttonData[i].id, buttonData[i].name, buttonData[i].state, buttonData[i].active, buttonData.length, true);
    }
};

Autodesk.Nano.GalleryStateView.prototype.removeStateButtons = function removeStateButtons() {
    var i;
    while (this.stateButtons.length > 0) {
        this.removeStateButton(this.stateButtons[0].id);
    }
};

Autodesk.Nano.GalleryStateView.prototype.getActiveStateButton = function getActiveStateButton() {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        if (this.stateButtons[i].active ) {
            return this.stateButtons[i];
        }
    }
    return false;
};

Autodesk.Nano.GalleryStateView.prototype.validateState = function validateState() {
    var state = JSON.stringify(MolViewer.getMolViewerState());
    var currentState = LZString144.compressToEncodedURIComponent(state);
    var activeButton = this.getActiveStateButton();
    var activeState;
    if (!activeButton) {
        return true; // this should never happen unless there are no snapshots
    }
    activeState = activeButton.stateString;
    if (activeState === currentState) {
        return true;
    }
    return false;
};

Autodesk.Nano.GalleryStateView.prototype.dropOrder = function dropOrder(event) {
    // this is a no op for the gallery state view since we do not allow reordering of buttons
};;/**
 * Created by andrewkimoto on 12/4/15.
 */

Autodesk.Nano.Item = function() {
    
};

//This is the default method to be overridden by objects down the prototype chain
//This method is designed to return an un-attached DOM object
Autodesk.Nano.Item.prototype.buildItem = function buildItem() {
    var div = document.createElement('div');
    return div;
};

//This method is the default method to be overridden by objects down the prototype chain
//This method returns the class name of the item div
Autodesk.Nano.Item.prototype.getItemClass = function getItemClass() {
    return 'unknown';
};;/**
 * Created by andrewkimoto on 12/4/15.
 */


Autodesk.Nano.ItemList = function(parentView, itemObj, instance) {
    this.app = parentView.app;
    this.molMan = parentView.app.MolMan;
    this.viewer = parentView.app.MoleculeViewer;
    this.viewManager = typeof ViewManager === 'object' ? ViewManager : parentView.app.ViewManager;
};

// This method is called in the constructor of the progeny of this prototype
Autodesk.Nano.ItemList.prototype.initialize = function initialize(instance,ItemObj) {
    var that = this;
    var _item = new ItemObj(that, that.molMan, that.viewer);
    var _items = [];
    var _listClass = 'instances';
    var _instance = instance;
    var _clickedItem;
    var _shiftClickedItem;
    var _prevShiftClickedItem;
    var _selectedItems;

    that.getListClass = function getListClass() {
        return _listClass;
    };

    that.getInstance = function getInstance() {
        return _instance;
        //return {selection: {selectedInstance:true}};
    };

    that.getInstanceName = function getInstanceName() {
        return 'Instance ' + (this.viewManager.getInstanceIndexFromID(_instance.id) + 1);
    };

    that.getItem = function getItem() {
        return _item;
    };

    that.setListClass = function setListClass(val) {
        _listClass = val;
    };

    that.setItems = function setItems(items) {
        _items = items;
    };

    that.getItems = function getItems() {
        return _items;
    };

    that.setClickedItem = function setClickedItem(item) {
        _clickedItem = item;
    };

    that.getClickedItem = function getClickedItem() {
        return _clickedItem;
    };

    that.setShiftClickedItem = function setClickedItem(item) {
        _shiftClickedItem = item;
    };

    that.getShiftClickedItem = function getClickedItem() {
        return _shiftClickedItem;
    };

    that.setPrevShiftClickedItem = function setClickedItem(item) {
        _prevShiftClickedItem = item;
    };

    that.getPrevShiftClickedItem = function getClickedItem() {
        return _prevShiftClickedItem;
    };

    that.getSelectedItems = function getSelectedItems() {
        return _selectedItems;
    };

    that.pushSelectedItem = function pushItem(item) {
        _selectedItems.push(item);
    };

    that.spliceSelectedItems = function spliceSelectedItems(index) {
        _selectedItems.splice(index,1);
    };

    that.clearSelectedItems = function clearSelectedItems() {
        _selectedItems = [];
    };
};

// because indexOf stinks
Autodesk.Nano.ItemList.prototype.findArrayIndex = function findArrayIndex(array,item) {
    var i;
    for (i = 0; i < array.length; i++) {
        if (array[i] === item) {
            return i;
        }
    }
    return -1;
};

Autodesk.Nano.ItemList.prototype.selectItems = function selectItems(event,item,selectById) {

    var i,
        cc1 = -1,
        cc2 = -1,
        loc,
        index,
        elements = this.getItems(),
        regex = selectById ? new RegExp(item.getItemClass() + 'Row-') : new RegExp(item.getItemName()+ ' '),
        getSelectedFromEvent = selectById ? this.getSelectedIdFromEvent : this.getSelectedItemFromEvent,
        getSelectedFromSelection = selectById ? this.getSelectedIdFromSelection : this.getSelectedItemFromSelection,
        getSelected = selectById ? this.getSelectedId : this.getSelectedItem;

    this.elements = elements;
    if (event.shiftKey) {
        if (typeof this.getShiftClickedItem() === 'number') {
            this.setPrevShiftClickedItem(this.getShiftClickedItem()); // need for cases where directionality of shift click changed
        }
        if(this.findArrayIndex(this.getItems(),event.target.parentNode) === -1) {
            this.setShiftClickedItem(this.findArrayIndex(this.getItems(),event.target));
        } else {
            this.setShiftClickedItem(this.findArrayIndex(this.getItems(),event.target.parentNode));
        }

    } else if (event.metaKey) {
        this.setShiftClickedItem(null);
        this.setPrevShiftClickedItem(null);
        if(this.findArrayIndex(this.getItems(),event.target.parentNode) === -1) {
            this.setClickedItem(this.findArrayIndex(this.getItems(),event.target));
        } else {
            this.setClickedItem(this.findArrayIndex(this.getItems(),event.target.parentNode));
        }
        index = this.findArrayIndex(this.getSelectedItems(),getSelectedFromEvent.call(this,event,regex));
        if (index !== -1) {
            this.spliceSelectedItems(index);
        } else {
            this.pushSelectedItem(getSelectedFromEvent.call(this,event,regex));
        }


    } else {
        if(this.findArrayIndex(this.getItems(),event.target.parentNode) === -1) {
            this.setClickedItem(this.findArrayIndex(this.getItems(),event.target));
        } else {
            this.setClickedItem(this.findArrayIndex(this.getItems(),event.target.parentNode));
        }

        this.setShiftClickedItem(null); // reset shiftClickedItem
        this.setPrevShiftClickedItem(null);
        this.clearSelectedItems();
        this.pushSelectedItem(getSelectedFromEvent.call(this,event,regex));
    }

    //clean up previous selections in the current block
    if (typeof this.getPrevShiftClickedItem() === 'number') {
        if (this.getPrevShiftClickedItem() > this.getClickedItem() && this.getShiftClickedItem() < this.getClickedItem()) {
            cc1 = this.getClickedItem();
            cc2 = this.getPrevShiftClickedItem();
        } else if (this.getPrevShiftClickedItem() < this.getClickedItem() && this.getShiftClickedItem() > this.getClickedItem()) {
            cc2 = this.getClickedItem();
            cc1 = this.getPrevShiftClickedItem();
        }

        if(cc1 !== -1) {
            for (i = cc1; i <= cc2; i++) {
                loc = this.findArrayIndex(this.getSelectedItems(),getSelectedFromSelection.call(this,elements[i],regex));
                if (loc !== -1) {
                    this.spliceSelectedItems(loc);
                }
            }
        }

        this.setPrevShiftClickedItem(null);
        cc1 = -1;
        cc2 = -1;
    }

    //build the list of selected items
    if (typeof this.getShiftClickedItem() === 'number') {
        if (this.getShiftClickedItem() > this.getClickedItem()) {
            cc1 = this.getClickedItem();
            cc2 = this.getShiftClickedItem();
        } else {
            cc1 = this.getShiftClickedItem();
            cc2 = this.getClickedItem();
        }

        for (i = cc1; i <= cc2; i++) {
            if (this.findArrayIndex(this.getSelectedItems(),getSelectedFromSelection.call(this,elements[i],regex)) === -1) {
                this.pushSelectedItem(getSelectedFromSelection.call(this,elements[i],regex));
            }
        }
        cc1 = -1;
        cc2 = -1;
    }

    if(this.molMan) {
        this.molMan.startUndoGroup();
    }
    this.parentView.selection = this.getSelectedItems();
    this.clearSelection();
    this.clearOtherViews(this.parentView);
    this.viewManager.setSelectionFromViews();
    if(this.molMan) {
        this.molMan.endUndoGroup();
    }
};

Autodesk.Nano.ItemList.prototype.clearSelection = function clearSelection() {
    this.molMan.molModels[this.molMan.currentMolModelID].clearSelection();
};

Autodesk.Nano.ItemList.prototype.clearOtherViews = function clearOtherViews(parentView) {
    this.viewManager.clearOtherViews(parentView);
};

Autodesk.Nano.ItemList.prototype.showSelectedItems = function showSelectedItems(event) {
    var i,
        j,
        rs = false,
        element,
        selectedItems = this.getItemsFromSelection(),
        items = this.findItems(selectedItems), //full def in the specific item view
        itemsLen = items.length,
        domItems = this.getDomItems(),
        domItemsLen = domItems.length;

    this.deselectSubTitles();

    for (i = 0; i < domItemsLen; i++) {
        domItems[i].classList.remove('selected','parent');
        for (j = 0; j < itemsLen; j++) {
            // add the 'selected' css class to the matching element;
            rs = this.addSelectedClass(domItems[i],items[j],i,rs);
        }
    }

    if (itemsLen === 0) {
        this.setClickedItem(0);
        this.setShiftClickedItem(null);
        this.setPrevShiftClickedItem(null);
        this.clearSelectedItems();
        this.parentView.selection = [];
    }

    this.setTitleSelection(rs);

    if(!this.getInstance().selection.instanceSelected) {
        //mark as parents residues with selected atoms that don't have views
        var parentItems = this.getParentItems();
        for (i = 0; i < parentItems.length; i++) {
            // add the 'parent' css class to the matching element;
            rs = this.addParentClass(parentItems[i],rs);
        }
    }

    if (rs) {
        this.viewManager.markUpstreamElements(this,false);
    }
};

Autodesk.Nano.ItemList.prototype.getSelectedItemFromEvent = function getSelectedItemFromEvent(event,regexItem) {
    return this.getSelectedItem(event.target,regexItem);
};

Autodesk.Nano.ItemList.prototype.getSelectedIdFromEvent = function getSelectedIdFromEvent(event,regexId) {
    return this.getSelectedId(event.target.parentElement,regexId);
};

Autodesk.Nano.ItemList.prototype.getSelectedItemFromSelection = function getSelectedItemFromSelection(element,regexItem) {
    return this.getSelectedItem(element,regexItem);
};

Autodesk.Nano.ItemList.prototype.getSelectedIdFromSelection = function getSelectedIdFromSelection(element,regexId) {
    return this.getSelectedId(element,regexId);
};

Autodesk.Nano.ItemList.prototype.getSelectedItem = function getSelectedItem(element,regexItem) {
    return element.textContent.replace(regexItem,'');
};

Autodesk.Nano.ItemList.prototype.getSelectedId = function getSelectedId(element,regexId) {
    return element.id.replace(regexId,'');
};

Autodesk.Nano.ItemList.prototype.buildItems = function buildItems(event) {
// Override to build a list of items
    return [];
};

Autodesk.Nano.ItemList.prototype.buildHeader = function buildHeader(event) {
// Override to build a header
};

Autodesk.Nano.ItemList.prototype.findItems = function findItems(selectedItems) {
// Override to build a list of items
    return MetaData.findItems('replaceMe',selectedItems);
};


// These methods used by showSelectedItems method
// Override any of them to give them the proper functionality progeny of this object

Autodesk.Nano.ItemList.prototype.getDomItems = function getDomItems() {
// Override to build a list of dom items specific to the list object
    return this.parentView.el.querySelectorAll('.replaceme');
};

Autodesk.Nano.ItemList.prototype.deselectSubTitles = function deselectSubTitles() {
    //Override to clear subtitles where needed
};

Autodesk.Nano.ItemList.prototype.setTitleSelection = function setTitleSelection(rs) {
    var titles = this.parentView.el.querySelectorAll('.title'),
        i;
    //remove selected class from title
    if (rs) {
        for (i = 0; i < titles.length; i++) {
            titles[i].classList.add('selected');
        }

    } else {
        for (i = 0; i < titles.length; i++) {
            titles[i].classList.remove('selected');
        }
    }
};

Autodesk.Nano.ItemList.prototype.getItemsFromSelection = function getItemsFromSelection() {
// Override to return the appropriate array of items from selection object;
    return [];
};

Autodesk.Nano.ItemList.prototype.compareDomItem = function compareDomItem(domItem, selectedItem) {
// Override to customize comparison
    return domItem === selectedItem;
};

Autodesk.Nano.ItemList.prototype.getParentItems = function getParentItems() {
// Override to build a list of 'parents of selection' items specific to the list object
};

Autodesk.Nano.ItemList.prototype.addSelectedClass = function addSelectedClass(domItems,items,i,j) {
// Override to add the 'selected' class to the appropriate element
    return false;
};

Autodesk.Nano.ItemList.prototype.addParentClass = function addParentClass() {
// Override to add the 'parent' class to the appropriate element
    return false;
};;/**
 * Created by andrewkimoto on 4/13/15.
 */

Autodesk.Nano.ListView = function(args) {
    var me = Autodesk.Nano.ListView.prototype;
    var ListObj,
        ItemObj;
    Autodesk.Nano.TopView.prototype._initializeElements.call(this);
    this.app = args.app;
    this.viewManager = typeof ViewManager === 'object' ? ViewManager : this.app.ViewManager;
    this.viewer = args.viewer;
    this.type = args.type;
    this.subType = args.subType;
    this.relatedType = args.relatedType;
    this.itemClass = args.itemClass;
    this.isRoot = args.isRoot;
    this.viewType = args.viewType;
    this.id = THREE.Math.generateUUID();
    this.upstreamView = args.upstreamView;
    this.upstreamElement = args.upstreamElement;
    this.parentView = args.panelView;
    this.viewManager.getTopView(this.parentView).listView = this;

    if(this.isRoot) { //root view
        this.instance = null;
    } else if (this.upstreamView.isRoot) {
        this.instance = this.viewManager.getInstanceFromID(this.upstreamElement.id.replace(/instance/,''));
    } else {
        this.instance = this.upstreamView.instance;
    }
    this.selection = [];
    ListObj = this.viewManager.parseObjectName(args.listObject);
    ItemObj = this.viewManager.parseObjectName(args.itemObject);
    this.itemList = new ListObj(this,ItemObj,this.instance);
    this._initialize();
};

Autodesk.Nano.ListView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.ListView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.ListView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
    this.itemList.buildItems(this.el);
    // Root view is built before model is loaded (this showSelectedItems
    // call is to show initial selection of downstream views; root view is
    // never created in a selected state.
    if (!this.isRoot) {
        this.itemList.showSelectedItems();
    }
};

Autodesk.Nano.ListView.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('div');
    this.el.setAttribute('class',this.itemList.getListClass());


    this.selectedItems = [];
    this.selection = [];
};


Autodesk.Nano.ListView.prototype._initializeEvents = function _initializeEvents() {
    var self = this;

    this.showSelected = function showSelected(event) {
        this.itemList.showSelectedItems(event);
    };

    this._bindEvents = function _bindEvents() {
        self.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
    };

    this._unbindEvents = function _unbindEvents() {
        self.viewer.removeEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
    };

    this.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
};

Autodesk.Nano.ListView.prototype.clearView = function clearView() {
    //ViewManager.getTopView(this.parentView).elementWrapper.innerHTML = null;

    this.itemList.setClickedItem(0);
    this.itemList.setShiftClickedItem(null);
    this.itemList.setPrevShiftClickedItem(null);
    this.selection = [];
    this.itemList.clearSelectedItems();
    this.viewManager.markUpstreamElements(this,true);
};

Autodesk.Nano.ListView.prototype.showSelectedItems = function showSelectedItems() {
    //override in item list objects down the prototype chain
};;/**
 * Created by andrewkimoto on 4/13/15.
 */

Autodesk.Nano.PanelView = function(args) {
    var me = Autodesk.Nano.PanelView.prototype;
    Autodesk.Nano.TopView.prototype._initializeElements.call(this);
    this.app = args.app;
    this.viewer = args.viewer;
    this.visible = true;
    this.type = args.type;
    this.animateDirection = 'left';
    this.displayType = 'flex';
    this.title = args.title;
    this.minTitle = args.minTitle;
    this.padTitle = args.padTitle;
    this.webkitDisplayType = '-webkit-flex';
    this.flexDirection = 'column';
    this.oldFlexBasis = args.oldFlexBasis;
    this.oldWebkitFlexBasis = args.oldFlexBasis;
    this.resizeMin = args.resizeMin;
    this.minimized = args.minimized;
    this.defaultMinimized = args.minimized;
    this.width = args.width;
    this.hasHScrollbar = args.hasHScrollbar;
    this.args = args;
    if (this.app && this.app.appID) {
        this.parentElement = document.querySelector('#browserBody-' + this.app.appID);
    } else {
        this.parentElement = document.querySelector('#browserBody');
    }

    this._initialize();

};

Autodesk.Nano.PanelView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.PanelView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.PanelView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.PanelView.prototype._initializeElements = function _initializeElements() {
    var self = this;
    this.el.style.display = this.displayType;
    this.el.style.display = '-webkit-flex';
    this.el.classList.add('panelView');
    this.el.style.flex = '0 0 ' +  this.width + 'px';
    this.el.style['-webkit-flex'] = '0 0 ' + this.width + 'px';
    this.el.style.flexDirection = this.flexDirection;
    this.el.style['-webkit-flex-direction'] = this.flexDirection;
    this.oldFlexBasis = this.width + 'px';
    this.setWidth(this.width);
    this.el.setAttribute('id',this.args.id);
    this.titleDiv = document.createElement('div');
    this.titleDiv.setAttribute('class',this.padTitle ? 'browser-title' : 'browser-title-nopad');
    if (this.hasHScrollbar) {
        this.titleDiv.classList.add('h-scroll');
    }
    this.backButton = document.createElement('div');
    this.backButton.className = "back-button browse";
    this.arrowImage  = document.createElement('div');
    this.arrowImage.className = "arrow-image reverse-browser mobile-browser-menu";
    this.backButton.appendChild(this.arrowImage);
    this.titleDiv.appendChild(this.backButton);

    this.viewToggle = document.createElement('div');
    this.viewToggle.setAttribute('class','view-toggle');
    this.viewToggle.innerHTML = 'Hide';
    this.titleText = document.createElement('div');
    this.titleText.setAttribute('class','panel-title');
    this.titleText.innerHTML=' ' + this.title;
    this.titleDiv.appendChild(this.viewToggle);
    this.titleDiv.appendChild(this.titleText);
    this.el.appendChild(this.titleDiv);

    this.elementWrapper = document.createElement('div');
    this.elementWrapper.setAttribute('class','browser-wrapper min-padding' + (this.hasHScrollbar ? ' h-scroll' : ''));

    this.minText = document.createElement('div');
    this.minText.setAttribute('class','browser-min-text');
    this.minText.innerHTML = this.args.minTitle;
    this.minLabel = document.createElement('div');
    this.minLabel.setAttribute('class','browser-min-label' + (this.padTitle ? ' pad ' : ' ') + 'hidden');
    this.minLabel.appendChild(this.minText);
    this.elementWrapper.appendChild(this.minLabel);

    this.el.appendChild(this.elementWrapper);

    this.parentElement.appendChild(this.el);

    this.selectedResidues = [];
};


Autodesk.Nano.PanelView.prototype._initializeEvents = function _initializeEvents() {
    var self = this;

    this.buildScrollbars = function buildScrollbars(e) {
        if (!e || typeof e.modelType === 'string') {
            if (self.hasHScrollbar) {
                if (!self.scrollbar) {
                    self.scrollbar = new Autodesk.Nano.ScrollView(self, self.el, self.elementWrapper, self.titleDiv.clientHeight + 1, 15);
                }
                if (!self.hScrollbar) {
                    self.hScrollbar = new Autodesk.Nano.ScrollView(self, self.el, self.elementWrapper, 0, 20, true);
                }
            } else {
                if (!self.scrollbar) {
                    self.scrollbar = new Autodesk.Nano.ScrollView(self, self.el, self.elementWrapper,self.titleDiv.clientHeight + 1);
                }
            }
        }
    };

    //this is needed to handle buggy clientHeight setting of wrapped flexboxes in Safari
    this.setWrapperHeight = function setWrapperHeight(e) {
        var bodyHeight,
            headerHeight,
            footerHeight;
        if(!e || e.modelType === 'mol' ) {
            bodyHeight = self.parentElement.parentElement.clientHeight;
            headerHeight = self.parentElement.previousSibling ? self.parentElement.previousSibling.clientHeight : 0;
            footerHeight = self.parentElement.nextSibling ? self.parentElement.nextSibling.clientHeight : 0;
            self.el.style.height = (bodyHeight - headerHeight - footerHeight - 1) + 'px';
            self.elementWrapper.style.height = (self.el.clientHeight - self.titleDiv.clientHeight - 1) + 'px';
        } else {
            self.el.style.height = (self.parentElement.clientHeight) + 'px';
            self.elementWrapper.style.height = (self.el.clientHeight - self.titleDiv.clientHeight - 1) + 'px';
        }
    };

    this.toggleViewBind = this.toggleView.bind(this);
    this.minimizeViewBind = this.minimizeView.bind(this);
    this.titleDiv.addEventListener('click',self.toggleViewBind);

    this.backButton.addEventListener('touchstart', touchStartToClick);
    this.backButton.addEventListener('click', function(event) {
        self.toggleUpstreamPanel(self.type);
        self.destroyView(event.target.dataset.viewId);
    });

    this._bindEvents = function _bindEvents() {
        self.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.setWrapperHeight);
        self.viewer.addEventListener(Autodesk.Viewing.BROWSER_RESIZED_EVENT, self.setWrapperHeight);
        self.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
        if(this.defaultMinimized) {
            self.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.minimizeViewBind);
        }
        // Scrollbars are not created if app is loaded without a model so
        // if there is no scrollbar we add the event listener  that will
        // create the scrollbar instead of updating the viewer object.
        if(self.scrollbar) {
            self.scrollbar.updateViewer(self.viewer);
        } else {
            self.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.buildScrollbars);
        }

    };

    this._unbindEvents = function _unbindEvents() {
        self.viewer.removeEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.setWrapperHeight);
        self.viewer.removeEventListener(Autodesk.Viewing.BROWSER_RESIZED_EVENT, self.setWrapperHeight);
        self.viewer.removeEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.buildScrollbars);
        self.viewer.removeEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
        if(self.defaultMinimized) {
            self.viewer.removeEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.minimizeViewBind);
        }
    };

    this.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.setWrapperHeight);
    this.viewer.addEventListener(Autodesk.Viewing.BROWSER_RESIZED_EVENT, self.setWrapperHeight);
    this.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.buildScrollbars);
    this.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
    if(this.defaultMinimized) {
        this.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, this.minimizeViewBind);
    }
};

Autodesk.Nano.PanelView.prototype.clearView = function clearView() {
    this.elementWrapper.innerHTML = null;
    this.clickedElement = 0;
    this.shiftClickedElement = null;
    this.prevShiftClickedElement = null;
};

Autodesk.Nano.PanelView.prototype.toggleView = function toggleView(event) {
    if ((!isTouchDevice() || window.innerWidth > Autodesk.Nano.MAX_TABLET_MODE_RESOLUTION)) {
        if(this.minimized) {
            this.restoreView();
            this.minimized = false;
            event.stopPropagation();
        } else {
            this.minimizeView();
            this.minimized = true;
            event.stopPropagation();
        }
    }
};

Autodesk.Nano.PanelView.prototype.minimizeView = function minimizeView() {
    this.el.addEventListener('click',this.toggleViewBind);
    this.titleText.classList.add('hidden');
    this.viewToggle.innerHTML = 'Show';
    this.viewToggle.classList.add('show');
    this.elementWrapper.classList.add('hidden-children');
    this.minLabel.classList.remove('hidden');
    this.oldFlexBasis = this.el.style.flexBasis;
    this.oldWebkitFlexBasis = this.el.style.WebkitFlexBasis;
    this.el.style.flexBasis = this.resizeMin[0] + 'px';
    this.el.style.WebkitFlexBasis = this.resizeMin[0] + 'px';
    this.viewer.fireEvent(Autodesk.Viewing.BROWSER_RESIZED_EVENT);
};

Autodesk.Nano.PanelView.prototype.restoreView = function restoreView() {
    this.el.removeEventListener('click',this.toggleViewBind);
    this.titleText.classList.remove('hidden');
    this.viewToggle.innerHTML = 'Hide';
    this.viewToggle.classList.remove('show');
    this.minLabel.classList.add('hidden');
    this.el.style.flexBasis = this.oldFlexBasis;
    this.el.style.WebkitFlexBasis = this.oldWebkitFlexBasis;
    delete this.oldFlexBasis;
    delete this.oldWebkitFlexBasis;
    this.elementWrapper.classList.remove('hidden-children');
    this.viewer.fireEvent(Autodesk.Viewing.BROWSER_RESIZED_EVENT);
};
;/**
 * Created by andrewkimoto on 8/25/16.
 */
/**
 * Created by andrewkimoto on 6/9/16.
 */
Autodesk.Nano.PresentationStateButton = function (id,parentElement,enumerator,parentView,name,active, stateString) {

    var me = Autodesk.Nano.PresentationStateButton.prototype;
    this.id = id;
    this.name = name;
    this.active = active ? true : false;
    this.enumerator = enumerator;
    this.parentElement = parentElement;
    this.app = parentView.app;
    this.parentView = parentView;
    this.stateString = stateString;
    this._initialize();
};

Autodesk.Nano.PresentationStateButton.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.PresentationStateButton.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.PresentationStateButton.prototype.destructor = function destructor() {
    this.el.innerHTML = '';
    this.el.remove();
};

Autodesk.Nano.PresentationStateButton.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('div');
    this.el.setAttribute('id','state-'+ this.id);
    this.el.setAttribute('class','presentation-state-button');
    if (this.active) {
        this.el.classList.add('active');
    }
    this.text = document.createElement('div');
    this.text.setAttribute('class','presentation-state-text');
    if (this.name) {
        this.text.innerHTML = this.name;
    }


    this.el.appendChild(this.text);
    this.parentElement.appendChild(this.el);
};

Autodesk.Nano.PresentationStateButton.prototype._initializeEvents = function _initializeEvents() {
    var self = this;

    this.setActive = function setActive(active) {
        self.active = active;
        if(active) {
            self.el.classList.add('active');
        } else {
            self.el.classList.remove('active');
        }
    };

    this.loadState = function loadState() {
        this.parentView.toggleViewButton(false);
        this.parentView.updateStatusViewPosition();
        var sv = self.app.ViewManager.getTopView('StatusView');
        sv.showCustomMessage('Loading Snapshot...');
        window.setTimeout(function() { // give browser time to show StatusView
            self.app.StateManager.restoreSnapshot(self.stateString);
            self.parentView.deselectStateButtons();
            self.setActive(true);
            sv.hide();
            self.parentView.showView();
            self.app.AnnotateMan.updateTitleWidth();

            self.parentView.toggleViewButton(true);
            self.parentView.setViewHeight(null,true);
        },100);

    };



    this.resetButton = function resetButton() {
        self.el.style.backgroundColor = '';
        self.updateButton.innerHTML = 'update';
    };

    this.loadStateBind = this.loadState.bind(this);

    this.el.addEventListener('click', this.loadStateBind);
};

;/**
 * Created by andrewkimoto on 8/25/16.
 */
/**
 * Created by andrewkimoto on 6/8/16.
 */

Autodesk.Nano.PresentationStateView = function (args) {

    var me = Autodesk.Nano.PresentationStateView.prototype;
    this.app = args.app;
    this.viewer = args.viewer;
    this.type = 'StateView';
    this.displayType = 'block';
    this.parentElement = this.app.container.querySelector(args.parentElement);
    this.stateButtons = [];
    this.nextButton = 1;
    this._initialize();
};

Autodesk.Nano.PresentationStateView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.PresentationStateView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.PresentationStateView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.PresentationStateView.prototype.destructor = function destructor() {
    this.el.innerHTML = '';
    this.el.remove();
    this.app.ViewManager.destroyTopView(this);
};

Autodesk.Nano.PresentationStateView.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('DIV');
    this.el.setAttribute('id','presentationStatePanel');
    this.el.style.display = 'none';
    this.showViewDiv = document.createElement('div');
    this.showViewDiv.setAttribute('class','presentation-toggle-panel');
    this.showViewButton = document.createElement('div');
    this.showViewButton.setAttribute('class','presentation-toggle-button');
    this.showViewDiv.appendChild(this.showViewButton);
    this.buttonDiv = document.createElement('div');
    this.buttonDiv.setAttribute('class','presentation-button-panel');
    this.captionDiv = document.createElement('div');
    this.captionDiv.setAttribute('class','presentation-caption-panel');
    this.copyright = document.createElement('div');
    this.copyright.setAttribute('class','presentation-copyright');
    this.copyright.innerHTML = 'Autodesk Research 2016';
    this.wrapper = document.createElement('div');
    this.wrapper.setAttribute('class','presentation-panel-wrapper hidden');
    this.wrapper.appendChild(this.showViewDiv);

    this.scrollMessageUp = document.createElement('div');
    this.scrollMessageUp.setAttribute('class','presentation-scroll-message');
    this.wrapper.appendChild(this.scrollMessageUp);
    this.scrollMessageDown = document.createElement('div');
    this.scrollMessageDown.setAttribute('class','presentation-scroll-message down');
    this.wrapper.appendChild(this.scrollMessageDown);

    this.el.appendChild(this.buttonDiv);
    this.el.appendChild(this.captionDiv);
    this.el.appendChild(this.copyright);
    this.wrapper.appendChild(this.el);
    this.parentElement.appendChild(this.wrapper);
    this.show();
    //this.el.style.height = (document.body.clientHeight - 100) + 'px';

    // The switcher works with Google cardboards that have a capacitive button or
    // at least a thumb-hole where the user can click the screen
    this.switcher = document.createElement('div');
    this.switcher.setAttribute('class','snapshot-switcher');
    this.viewer.container.appendChild(this.switcher);
};



Autodesk.Nano.PresentationStateView.prototype._initializeEvents = function _initializeEvents() {
    var self = this;

    this.loadNextSnapshot = function() {
        var snapshots = self.app.ViewManager.getTopView('StateView').stateButtons;
        var i;
        var nextSnapshot = null;
        for (i = 0; i < snapshots.length; ++i) {
            if (snapshots[i].active) {
                nextSnapshot = snapshots[(i === snapshots.length - 1 ? 0 : i + 1)];
                break;
            }
        }
        if (nextSnapshot) {
            nextSnapshot.loadState();
        }

    };

    this.toggleViewButton = function toggleViewButton(show) {
        if (show) {
            if(this.el.clientWidth < 640) {
                this.showViewButton.classList.remove('transparent');
            }
        } else {
            if(this.el.clientWidth < 640) {
                this.showViewButton.classList.add('transparent');
            }
        }
    };

    this.switcher.addEventListener('click', function() {
        self.loadNextSnapshot();
    });

    this.removeStateButtonsBind = this.removeStateButtons.bind(this);

    this._bindEvents = function _bindEvents() {
        self.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self.removeStateButtonsBind);
        //self.viewer.addEventListener(Autodesk.Nano.MODEL_END_LOADED_EVENT, self.showViewBind);
    };

    this._unbindEvents = function _unbindEvents() {
        self.viewer.removeEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self.removeStateButtonsBind);
        //self.viewer.removeEventListener(Autodesk.Nano.MODEL_END_LOADED_EVENT, self.showViewBind);
    };

    //Changes position of statusview based on height of the presentationstateview
    // Also updates the height of self.el to work in coordination with the media query min width
    this.updateStatusViewPosition = function updateStatusViewPosition() {
        var statusBar = self.app.container.querySelector('#statusBar');
        var h = null;
        var h1 = self.app.container.clientHeight;
        var h2 = self.app.container.clientWidth;
        var portraitHeight = h1 > h2 ? h1 : h2;  // for mobile
        var landscapeHeight = h1 > h2 ? h2 : h1; // for mobile
        if(screen && screen.orientation) {
            if (screen.orientation.type === "portrait-primary") {
                h = portraitHeight - 100;
            } else { //landscape
                if (portraitHeight / landscapeHeight > 1.80) { //ratio of smaller than 16:9 means address bar is accounted for
                    h = landscapeHeight - 100;
                } else {
                    h = landscapeHeight - 181;
                }
            }
        }

        statusBar.style.bottom = self.el.clientHeight+'px';
        if(self.el.clientWidth > 640) { //this should be the same as the media query max-width
            statusBar.style.marginBottom = '0';
            self.el.style.height = 'auto';
        } else if (self.el.style.height === 'auto') {
            statusBar.style.marginBottom = '0px';
        } else {
            statusBar.style.marginBottom = '0px';
        }
        if (self.el.style.height !== '0px') {
            self.setViewHeight(null,true,h);  //include the h parameter, only not null if mobile
        }
    };

    this.setViewHeight = function setViewHeight(event,keepOpen,h) {
        var that = this;
        var maxHeight = typeof h === 'number' ? h : document.body.clientHeight - 100;
        var height;
        var testHeight;
        if(this.el.clientHeight === 0 || keepOpen) {
            testHeight = that.buttonDiv.clientHeight + that.captionDiv.clientHeight + that.copyright.clientHeight;
            height = (testHeight > maxHeight ? maxHeight : testHeight) + 'px';
            this.el.style.height = height;
            window.setTimeout(function() {
                that.showViewButton.classList.add('open');
                if (that.el.clientHeight < that.el.scrollHeight) {
                    that.scrollMessageDown.classList.add('active'); //set this in startup
                }
            },200);
        } else {
            this.el.style.height = '0px';
            that.scrollMessageUp.classList.remove('active');
            that.scrollMessageDown.classList.remove('active');
            window.setTimeout(function() {that.showViewButton.classList.remove('open');},200);
        }
    };

    this.updateScrollMessage = function updateScrollMessage() {
        if (self.el.scrollTop > 0) {
             self.scrollMessageUp.classList.add('active');
        } else {
            self.scrollMessageUp.classList.remove('active');
        }
        if (self.el.scrollTop + self.el.clientHeight === self.el.scrollHeight) {
            self.scrollMessageDown.classList.remove('active');
        } else {
            self.scrollMessageDown.classList.add('active');
        }
    };

    this.showView = function showView() {
        if (this.wrapper.classList.contains('hidden')) {
            this.wrapper.classList.remove('hidden');
        } else {
            this.wrapper.classList.add('hidden');
        }
    };
    this.showViewBind = this.showView.bind(this);

    this.showViewButton.addEventListener('click',this.setViewHeight.bind(this));

    this.el.addEventListener('scroll', this.updateScrollMessage);


    // We need to differentiate between mobile devices that change screen dimensions due to
    // changes in orientation vs. desktops/laptops that change screen dimensions by resizing
    // the browser window.
    if(Autodesk.Viewing.isMobileDevice()) {
        window.addEventListener('orientationchange', this.updateStatusViewPosition);
    } else {
        window.addEventListener('resize', this.updateStatusViewPosition);
    }
    this.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, this.removeStateButtonsBind);
    this.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, this.removeStateButtonsBind);
    this.viewer.addEventListener(Autodesk.Viewing.ASSEMBLY_SET_EVENT, this.showViewBind);
};

Autodesk.Nano.PresentationStateView.prototype.showSwitcher = function showSwitcher(show) {
    if (show) {
        this.switcher.classList.add('active');
    } else {
        this.switcher.classList.remove('active');
    }
};


Autodesk.Nano.PresentationStateView.prototype.addStateButton = function addStateButton(id, name, stateString, active, restored) {
    var stateButton = new Autodesk.Nano.PresentationStateButton(id,this.buttonDiv,this.nextButton,this, name, active, stateString);
    this.stateButtons.push(stateButton);
    this.nextButton += 1;
    if(!restored) {
        this.deselectStateButtons();
        stateButton.text.focus();
        stateButton.text.select();
        stateButton.setActive(true);
    }
    if (this.el.clientHeight < this.el.scrollHeight) {
        this.scrollMessageDown.classList.add('active'); //set this in startup
    }
};

Autodesk.Nano.PresentationStateView.prototype.removeStateButton = function removeStateButton(id) {
    var stateButtonInfo = this.getStateButtonInfo(id);
    if (stateButtonInfo) {
        stateButtonInfo.button.destructor();
        this.stateButtons.splice(stateButtonInfo.index,1);
        //delete this.stateButtons[id];
        if (this.stateButtons.length === 0) { //no more stateButtons
            this.el.classList.remove('active');
        }

    }
    if (this.el.clientHeight < this.el.scrollHeight) {
        this.scrollMessageDown.classList.add('active'); //set this in startup
    }
};


Autodesk.Nano.PresentationStateView.prototype.deselectStateButtons = function deselectStateButtons() {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        this.stateButtons[i].active = false;
        this.stateButtons[i].el.classList.remove('active');
    }
};

//find the stateButton in the array, return the button and its index
//as an object
Autodesk.Nano.PresentationStateView.prototype.getStateButtonInfo = function getStateButtonInfo(id) {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        if (this.stateButtons[i].id === id) {

            return {button: this.stateButtons[i], index: i};
        }
    }
    return false; //not found
};

//restore buttons from button array
Autodesk.Nano.PresentationStateView.prototype.restoreStateButtons = function restoreStateButtons(buttonData) {
    var i,
        button;
    // remove existing buttons
    if (this.stateButtons.length > 0) {
        this.removeStateButtons();
    }

    for (i = 0; i < buttonData.length; ++i) {
        button = this.addStateButton(buttonData[i].id, buttonData[i].name, buttonData[i].state, buttonData[i].active, true);
    }
};

Autodesk.Nano.PresentationStateView.prototype.removeStateButtons = function removeStateButtons() {
    var i;
    while (this.stateButtons.length > 0) {
        this.removeStateButton(this.stateButtons[0].id);
    }
};

Autodesk.Nano.PresentationStateView.prototype.getActiveStateButton = function getActiveStateButton() {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        if (this.stateButtons[i].active ) {
            return this.stateButtons[i];
        }
    }
    return false;
};

Autodesk.Nano.PresentationStateView.prototype.validateState = function validateState() {
    var state = JSON.stringify(MolViewer.getMolViewerState());
    var currentState = LZString144.compressToEncodedURIComponent(state);
    var activeButton = this.getActiveStateButton();
    var activeState;
    if (!activeButton) {
        return true; // this should never happen unless there are no snapshots
    }
    activeState = activeButton.stateString;
    if (activeState === currentState) {
        return true;
    }
    return false;
};

Autodesk.Nano.PresentationStateView.prototype.hideScrollMessages = function hideScrollMessages() {
    var items = this.app.container.querySelectorAll('.presentation-scroll-message');
    var i;
    for (i = 0; i < items.length; ++i) {
        items[i].classList.remove('active');
    }
};

Autodesk.Nano.PresentationStateView.prototype.dropOrder = function dropOrder(event) {
    // this is a no op for the presentation state view since we do not allow reordering of buttons
};;Autodesk.Nano.ResizerView = function (args) {

    var me = Autodesk.Nano.ResizerView.prototype;
    this.app = args.app;
    this.viewer = args.viewer;
    if (this.app.ViewManager) {
        this.viewManager = this.app.ViewManager;
    } else {
        this.viewManager = ViewManager;
    }

    // resizer type and target
    this.resizeType = args.resizeType;
    this.type = args.type;
    this.isResizer = true;
    this.noBorder = args.noBorder;
    //this.view1 = args.target1;
    this.view1 = this.viewManager.getTopView(args.target1.name);
    this.target1 = this.view1.el;
    this.target1Min = this.view1.resizeMin;
    this.view2 = this.viewManager.getTopView(args.target2.name);
    if(this.view2) {
        this.target2 = this.view2.el;
        this.target2Min = this.view2.resizeMin;
    } else {
        this.target2 = false;
    }


    this.parentElement=this.app.container.querySelector(args.parentElement);
    this.insertTarget = this.viewManager.getTopView(args.insertTarget.name);
    if (this.insertTarget) {
        this.insertElement = this.insertTarget[args.insertElement];
    } else {
        this.insertElement = this.app.container.querySelector(args.insertElement);
    }

    this.innerTarget = this.viewManager.getTopView(args.innerTarget.name); //the view
    //this.innerView = args.innerTarget;
    this.innerTargetMin = false;
    if (this.innerTarget) {
        this.innerElement = this.innerTarget.el;
        if (this.innerTarget) {
            this.innerTargetMin = this.innerTarget.resizeMin;
        }
    }
    this.isSafari = navigator.userAgent.toLowerCase().match(/safari/);

    this._initialize();
};

Autodesk.Nano.ResizerView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.ResizerView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.ResizerView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.ResizerView.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('DIV');
    this.el.setAttribute('class',this.resizeType === 'row' ? 'resize-row' : 'resize-column');
    this.title = document.createElement('div');
    this.title.setAttribute('class','browser-title-empty');
    this.title.innerHTML='&nbsp;';
    this.el.appendChild(this.title);

    this.resizerWrapper = document.createElement('div');
    this.resizerWrapper.setAttribute('class','browser-wrapper');
    if (this.noBorder === true) {
        this.resizerWrapper.classList.add('no-border');
    }
    this.el.appendChild(this.resizerWrapper);

    this.parentElement.insertBefore(this.el,this.insertElement);
};

Autodesk.Nano.ResizerView.prototype._initializeEvents = function _initializeEvents() {

    var self = this;

    this.mouseDown = function mouseDown(event) {
        self.start = event.clientX;
        document.addEventListener('mousemove', self.mouseMove);
        document.addEventListener('mouseup', self.mouseUp);
        //turn scrollbars off when resizing so default scrollbar does not appear during resizing
        if (self.target1 && self.target1.querySelector('.browser-wrapper')) {
            self.target1.querySelector('.browser-wrapper').style.overflowY = 'hidden';
            self.min1 = self.view1.minimized ? 0 : 1; //pick non-minimized or minimized minimum size
        }
        if (self.target2 && self.target2.querySelector('.browser-wrapper')) {
            self.target2.querySelector('.browser-wrapper').style.overflowY = 'hidden';
            self.min2 = self.view2.minimized ? 0 : 1; //pick non-minimized or minimized minimum size
        }
        if(self.innerTarget) {
            self.innerMin = self.innerTarget.minimized ? 0 : 1; //pick non-minimized or minimized minimum size
        }
    };

    //move (drag)
    if (this.target1) { // only target1 has explicit width
        if(!this.target2) {
            this.el.style.marginRight = '-10px';
            this.el.style.zIndex = 1;
        }

        this.mouseMove = function mouseMove(event) {
            var fB = self.isSafari ? 'WebkitFlexBasis' : 'flexBasis',
                innerNew,
                delta = event.clientX - self.start,
                new1 = parseInt(self.target1.style[fB],10) + delta;

            if (new1 <= self.target1Min[self.min1]) {
                new1 = self.target1Min[self.min1];
            }

            self.start = event.clientX;
            self.target1.style[fB] = new1 + 'px';

            if (self.innerTarget) {
                innerNew = parseInt(self.target1.style[fB],10) - (self.innerElement.offsetLeft);
                innerNew = innerNew <= self.innerTargetMin[self.innerMin] ? self.innerTargetMin[self.innerMin] : innerNew;
                self.innerElement.style[fB] = innerNew  +'px';
            }
            self.viewManager.setViewerSize();
        };

    } else {

        this.mouseMove = function mouseMove(event) {
            var fB = self.isSafari ? 'WebkitFlexBasis' : 'flexBasis',
                delta = event.clientX - self.start,
                new2 = parseInt(self.target2.style[fB],10) - delta;

            if (new2 <= self.target2Min[self.min2]) {
                new2 = self.target2Min[self.min2];
            }

            self.start = event.clientX;

            self.target2.style[fB] = new2 + 'px';
        };

    }

    //drop
    this.mouseUp = function mouseUp(event) {
        document.removeEventListener('mousemove', self.mouseMove);
        document.removeEventListener('mouseup', self.mouseUp);
        //turn scrolling back on
        if (self.target1 && self.target1.querySelector('.browser-wrapper')) {
            self.target1.querySelector('.browser-wrapper').style.overflowY = 'auto';
        }
        if (self.target2 && self.target2.querySelector('.browser-wrapper')) {
            self.target1.querySelector('.browser-wrapper').style.overflowY = 'auto';
        }
        self.viewer.fireEvent({type: Autodesk.Viewing.BROWSER_RESIZED_EVENT});
    };

    this.el.addEventListener('mousedown', this.mouseDown);
};
;/**
 * Created by andrewkimoto on 5/21/15.
 */

Autodesk.Nano.ScrollView = function (parentView, parentElement, scrollElement, preOffset, postOffset,horizontal) {
    var i;
    this.app = parentView.app;
    this.viewManager = typeof ViewManager === 'object' ? ViewManager : this.app.ViewManager;
    this.prevPos = 0;
    this.viewer = parentView.viewer;
    this.parentView = parentView;
    this.parentElement = parentElement;
    this.scrollElement = scrollElement;
    this.parentSelection = '';
    this.prevParentSelection = '';
    this.preOffset = preOffset || 33;
    this.preOffset = preOffset === undefined ? 33: preOffset;
    this.postOffset = postOffset || 0;

    if(horizontal) {
        this.horizontal = true;
        this.majorAxis = 'width';
        this.minorAxis = 'height';
        this.pos = 'clientX';
        this.layerPos = 'layerX';
        this.size = 'clientWidth';
        this.start = 'left';
        this.offsetStart = 'offsetLeft';
        this.scrollStart = 'scrollLeft';
        this.scrollSize = 'scrollWidth';
        this.change = 'deltaX';
    } else {
        this.horizontal = false;
        this.majorAxis = 'height';
        this.minorAxis = 'width';
        this.pos = 'clientY';
        this.layerPos = 'layerY';
        this.size = 'clientHeight';
        this.start = 'top';
        this.offsetStart = 'offsetTop';
        this.scrollStart = 'scrollTop';
        this.scrollSize = 'scrollHeight';
        this.change = 'deltaY';
    }

    this._initialize();
};

Autodesk.Nano.ScrollView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.ScrollView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.ScrollView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};


Autodesk.Nano.ScrollView.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('div');
    this.el.setAttribute('class','scroll-cover' + (this.horizontal ? '-h' : ''));
    if (this.horizontal) {
        this.el.style[this.majorAxis] = "100%";
    } else {
        this.el.style[this.majorAxis] = "calc(100% - " + (this.preOffset + this.postOffset) + "px)";
    }
    //annoying FireFox hack
    this.el.style[this.minorAxis] = this.viewManager.isSafari ? '10px' : '15px';
    this.el.style[this.start] = this.preOffset + "px";

    this.scrollbar = document.createElement('div');
    this.scrollbar.setAttribute('class','scrollbar' + (this.horizontal ? '-h' : ''));
    this.scrollbar.style[this.majorAxis] = "calc(100% - " + (this.preOffset + this.postOffset) + "px)";
    this.scrollbar.style[this.start] = this.preOffset + "px";

    this.scrollThumb = document.createElement('div');
    this.scrollThumb.setAttribute('class','scroll-thumb' + (this.horizontal ? '-h' : ''));

    this.scrollbar.appendChild(this.scrollThumb);
    this.parentElement.appendChild(this.el);
    this.parentElement.appendChild(this.scrollbar);
};


Autodesk.Nano.ScrollView.prototype._initializeEvents = function _initializeEvents() {
    var self = this;


    /**
     * Handles moving the scrollbar thumb when scrollElement is scrolled.
     * Also scrolls the scrollElement when the scrollbar is scrolled.
     *
     * @parameter {object} event - the wheel or scroll event
     */
    this.scrollWheel = function scrollWheel(event) {
        var res = self.scrollElement,
            scrollSize = self.scrollElement.parentNode[self.size] - self.preOffset - self.postOffset,
            change = scrollSize * (event[self.change] / res[self.scrollSize]),
            thumbStart = self.scrollThumb[self.offsetStart],
            thumbSize = self.scrollThumb[self.size];

        if (thumbStart + change <= 0) {
            thumbStart = 0;
        } else if (thumbStart + thumbSize + change >= res[self.size]) {
            thumbStart = scrollSize - thumbSize;
        } else {
            thumbStart = thumbStart + change;
        }
        self.scrollThumb.style[self.start] = thumbStart + 'px';
        if (event.currentTarget === self.el || event.currentTarget === self.scrollbar) {
            self.scrollContent(event);
        }
        if (self.horizontal) {
            self.scrollTitle(event);
        }
    };

    //bind events needed for scrollbar operation
    if(!this.horizontal) {  // wheel can only be bound to one
        this.scrollElement.addEventListener('wheel', this.scrollWheel);
        this.scrollElement.addEventListener('mousewheel', this.scrollWheel);
        this.el.addEventListener('wheel', this.scrollWheel);
        this.el.addEventListener('mousewheel', this.scrollWheel);
        this.scrollbar.addEventListener('wheel', this.scrollWheel);
        this.scrollbar.addEventListener('mousewheel', this.scrollWheel);
    }

    this.scrollElement.addEventListener('scroll',this.scrollWheel);
    this.el.addEventListener('scroll',this.scrollWheel);
    this.scrollbar.addEventListener('scroll',this.scrollWheel);


    /**
     * Handles clicks on the scrollbar track
     * @parameter {object} event - the click event
     */
    this.scrollClick = function scrollClick(event) {
        var size = self.scrollElement.parentNode[self.size] - self.preOffset - self.postOffset,
            scrollSize = self.scrollElement[self.scrollSize],
            scrollStart = self.scrollElement[self.scrollStart],
            thumbSize = self.scrollThumb[self.size] || 0,
            thumbStart = parseInt(self.scrollThumb.style[self.start],10) || 0;

        if (!self.dragging) {
            thumbStart = isNaN(thumbStart) ? 0 : thumbStart;
            //conditional to determine whether to scroll up or down
            if (event[self.layerPos] < thumbStart) {
                self.scrollElement[self.scrollStart] = scrollStart - size;

                thumbStart = thumbStart - (size * (size / scrollSize));
                thumbStart = thumbStart < 0 ? 0 : thumbStart;
                self.scrollThumb.style[self.start] = thumbStart + 'px';
            } else {
                self.scrollElement[self.scrollStart] = scrollStart + size;
                thumbStart = thumbStart + (size * (size / scrollSize));
                thumbStart = thumbStart + thumbSize > size ? size - thumbSize : thumbStart;
                self.scrollThumb.style[self.start] = thumbStart + 'px';
            }
        }
    };

    this.scrollbar.addEventListener('click', self.scrollClick);


    /**
     * Handles drag start on scrollbar scroll thumb
     *
     * @parameter {object} event - the mouseDown event
     */
    this.beginDrag = function beginDrag(event) {
        self.dragging = true;
        self.prevPos = event[self.pos];
        self.scrollThumb.removeEventListener('mousedown',self.beginDrag);
        self.scrollbar.removeEventListener('click', self.scrollClick);
        document.addEventListener('mousemove', self.performDrag);
        document.addEventListener('mouseup',self.endDrag);
    };

    this.scrollThumb.addEventListener('mousedown', self.beginDrag);


    /**
     * Handles the dragging of the scrollbar scroll thumb.
     * Sets the scrollStart of the scrollElement
     * @parameter {object} event - the mouseMove event
     */
    this.performDrag = function performDrag(event) {
        var currentPos = event[self.pos],
            movement = currentPos - self.prevPos;
        self.prevPos = currentPos;

        if(event.which === 1) {
            var thumbPos = self.scrollThumb[self.offsetStart] + movement,
                thumbSize = self.scrollThumb[self.size],
                scrollSize = self.scrollElement[self.scrollSize],
                size = self.scrollElement.parentNode[self.size] - self.preOffset - self.postOffset - thumbSize,
                scroll = self.scrollElement[self.scrollStart] + (movement * (scrollSize / size));

            if (thumbPos < 0) {
                thumbPos = 0;
            } else if (thumbPos > size) {
                thumbPos = size;
            }

            if (scroll < 0) {
                scroll = 0;
            } else if (scroll > scrollSize) {
                scroll = size;
            }
            self.scrollElement[self.scrollStart] = scroll;
            self.scrollThumb.style[self.start] = thumbPos + 'px';
        }
    };


    /**
     * End the drag of the scroll thumb
     * Unbinds and binds events
     * @param {object} event the mouseUp event
     */
    this.endDrag = function endDrag(event) {
        document.removeEventListener('mouseup',self.endDrag);
        self.scrollThumb.addEventListener('mousedown',self.beginDrag);
        self.scrollbar.addEventListener('click', self.scrollClick);
        document.removeEventListener('mousemove', self.performDrag);
        //delete dragging flag after timeout to ensure that it is deleted after the click event fires
        window.setTimeout(self.deleteDragging, 100, self);
    };


    /**
     * Deletes the dragging property that is set when dragging begins
     */
    this.deleteDragging = function deleteDragging(self) {
        delete self.dragging;
    };


    /**
     * Scrolls the scrollElement element (The event is
     */
    this.scrollContent = function scrollContent(event) {
        self.scrollElement[self.scrollStart] = self.scrollElement[self.scrollStart] + event[self.change];
    };
    this.scrollTitle = function scrollTitle(event) {
        self.parentView.titleDiv[self.scrollStart] = event.target[self.scrollStart];
    };

    /**
     * Checks for children and if only one, resets the thumbnail style[self.start] to 0
     * and sets scrollElement[self.scrollStart] to 0.
     * In all cases calls the updateScrollbar method
     */
    this.resetScrollbar = function resetScrollbar() {
        if(self.viewManager.findViews('parentView',self.viewManager.topViews[self.parentView.type]).length <= 1) {
            self.scrollThumb.style[self.start]='0px';
            self.scrollElement[self.scrollStart] = 0;
        }
        self.updateScrollbar();

    };

    this.scrollBottom = function scrollBottom() {
        self.scrollElement[self.scrollStart] = self.scrollElement[self.scrollSize] - self.scrollElement[self.size];
        self.scrollThumb.style[self.start] = self.scrollElement[self.size] - self.scrollThumb[self.size] + 'px';
    };

    /**
     * Sets the scrollbar thumb size and visibility
     */
    this.updateScrollbar = function updateScrollbar() {
        self.scrollThumb.style[self.majorAxis] = self._getScrollthumbSize();
        self._setScrollBarVisibility();
    };

    this._bindEvents = function _bindEvents() {
        self.viewer.addEventListener(Autodesk.Viewing.BROWSER_RESIZED_EVENT, self.updateScrollbar);
        self.viewer.addEventListener(Autodesk.Viewing.VIEW_CREATED_EVENT, self.resetScrollbar);
        self.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
    };

    this._unbindEvents = function _unbindEvents() {
        self.viewer.removeEventListener(Autodesk.Viewing.BROWSER_RESIZED_EVENT, self.updateScrollbar);
        self.viewer.removeEventListener(Autodesk.Viewing.VIEW_CREATED_EVENT, self.resetScrollbar);
        self.viewer.removeEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
    };

    this.viewer.addEventListener(Autodesk.Viewing.BROWSER_RESIZED_EVENT, self.updateScrollbar);
    this.viewer.addEventListener(Autodesk.Viewing.VIEW_CREATED_EVENT, self.resetScrollbar);
    this.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);


};


/**
 * Get the appropriate scroll thumb size
 * @returns {string} retVal the css formatted size for the scroll thumb
 */
Autodesk.Nano.ScrollView.prototype._getScrollthumbSize = function _getScrollthumbSize() {
    var res = this.scrollElement,
        size = res.parentNode[this.size] - this.preOffset,// - this.postOffset,
        retVal = '10px';
    if (res) {
        retVal = size * (size/res[this.scrollSize]);
    }
    retVal = retVal < 40 ? 40 : retVal;
    retVal = retVal + 'px';
    return retVal;
};


/**
 * Set scrollbar visibility based on comparison of scrollSize and clientHeight
 */
Autodesk.Nano.ScrollView.prototype._setScrollBarVisibility = function _setScrollBarVisibility() {
    var titleElement = this.scrollElement.parentNode.querySelector('.browser-title,.browser-title-nopad');
    var titleHeight = 0;
    if (titleElement) {
        titleHeight = titleElement[this.size];
    }
    var size = this.scrollElement.parentNode[this.size] - this.preOffset ;
    if (this.scrollElement[this.scrollSize] <= size + 1) {
        this.scrollbar.style.display = 'none';
        this.el.style.display = 'none';
    } else {
        this.scrollbar.style.display = 'block';
        this.el.style.display = 'block';
    }
};


;/**
 * Created by andrewkimoto on 4/13/15.
 */

Autodesk.Nano.ShareView = function(args) {
    var me = Autodesk.Nano.ShareView.prototype;

    this.isSafari = navigator.userAgent.toLowerCase().match(/safari/)
            && !navigator.userAgent.toLowerCase().match(/chrome/) ? true : false;
    this.app = args.app;
    this.viewer = args.viewer;
    this.nanoViewer = MolViewer;
    this.nanoManager = TheMolMan;
    this.svfName = args.svfName;
    this.visible = true;
    this.type = 'ShareView';
    this.animateDirection = 'left';
    this.displayType = this.isSafari ? '-webkit-flex' : 'flex';
    this.flexDirection = 'column';
    this.resizeMin = 220;
    this.parentElement = this.app.container.querySelector('#InspectorPanel-' + this.app.appID);
    this.dimensions = ['400 x 300 px', '600 x 450 px', '800 x 600 px', '100% x 100%'];
    //parameters used to build the embedded or shared view
    this.shareParams = {
        name: 'My Shared Molecule',
        description: 'Lorem ipsum dolor sit amet.',
        viewerOnly: true,
        viewCube: false,
        splashScreen: false,
        tutorial: true,
        svfPath: '',
        width: '600px',
        height: '450px'
    };

    this._initialize();
};

Autodesk.Nano.ShareView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.ShareView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.ShareView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.ShareView.prototype._initializeElements = function _initializeElements() {
    var dot,
        icon,
        switchText,
        switchMark,
        divider,
        spacer;

    this.el = document.createElement('DIV');
    this.el.style.flex = '0 0 220px';
    this.el.style.WebkitFlex = '0 0 220px';
    this.el.setAttribute('id','share-' + this.app.appID);
    this.el.setAttribute('style','display:none;');

    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = "scroll-container";

    this.closeButton = document.createElement('div');
    this.closeButton.className = "close-button";

    this.closeImg = document.createElement('div');
    this.closeImg.className = "close-img";
    this.closeButton.appendChild(this.closeImg);


    this.shareHeader = document.createElement('div');
    this.shareHeader.setAttribute('id','shareHeader');

    this.shareBody = document.createElement('div');
    this.shareBody.setAttribute('id','shareBody');

    this.panelSwitch = document.createElement('div');
    this.panelSwitch.setAttribute('class','panel-switch-container');
    this.modifySwitch = document.createElement('div');
    this.modifySwitch.setAttribute('class','panel-switch');
    switchText = document.createElement('div');
    switchText.setAttribute('class','panel-switch-text');
    switchText.innerHTML = 'Modify';
    switchMark = document.createElement('div');
    switchMark.setAttribute('class','panel-switch-mark');
    this.modifySwitch.appendChild(switchText);
    this.modifySwitch.appendChild(switchMark);
    this.modifySwitch.addEventListener('click',this.modifySwitchCB.bind(this));
    this.shareSwitch = document.createElement('div');
    this.shareSwitch.setAttribute('class','panel-switch right active');
    switchText = document.createElement('div');
    switchText.setAttribute('class','panel-switch-text');
    switchText.innerHTML = 'Share';
    switchMark = document.createElement('div');
    switchMark.setAttribute('class','panel-switch-mark');
    this.shareSwitch.appendChild(switchText);
    this.shareSwitch.appendChild(switchMark);

    this.panelSwitch.appendChild(this.modifySwitch);
    this.panelSwitch.appendChild(this.shareSwitch);
    this.shareHeader.appendChild(this.panelSwitch);


    this.nameLabel = document.createElement('div');
    this.nameLabel.setAttribute('class','bold-header representation');
    this.nameLabel.innerHTML = 'Name';

    this.nameInput = document.createElement('input');
    this.nameInput.setAttribute('type','text');
    this.nameInput.setAttribute('class','share-input');
    this.nameInput.addEventListener('change',this.shareParamChangedCB.bind(this,'name'));

    this.descLabel = document.createElement('div');
    this.descLabel.setAttribute('class','bold-header representation');
    this.descLabel.innerHTML = 'Description';

    this.descTextArea = document.createElement('textarea');
    this.descTextArea.setAttribute('class','share-textarea');
    this.descTextArea.setAttribute('placeholder', 'Add some notes to your model');
    this.descTextArea.addEventListener('change',this.shareParamChangedCB.bind(this,'description'));

    divider = document.createElement('div');
    divider.setAttribute('class','share-divider');

    this.btnShare = document.createElement('button');
    this.btnShare.setAttribute('class','share-button');
    this.btnShare.setAttribute('id','btnShareLink');
    this.btnShare.innerHTML = 'Generate hyperlink';

    this.linkInput = document.createElement('input');
    this.linkInput.setAttribute('type','text');
    this.linkInput.setAttribute('class','share-input mt10');
    this.linkLabel = document.createElement('div');
    this.linkLabel.setAttribute('class','share-info');
    this.linkLabel.innerHTML = 'Copy and send above link to share your model.';

    spacer = document.createElement('div');
    spacer.setAttribute('class','share-spacer');

    this.btnEmbed = document.createElement('button');
    this.btnEmbed.setAttribute('class','share-button');
    this.btnEmbed.setAttribute('id','btnShareLink');
    this.btnEmbed.innerHTML = 'Embed in website';

    this.dimensionDiv = document.createElement('div');
    this.dimensionDiv.setAttribute('id','assemblyDiv');
    this.dimensionDiv.setAttribute('class','share-control');
    this.dimensionValue = document.createElement('div');
    this.dimensionValue.setAttribute('class','share-value');
    this.dimensionValue.innerHTML = '600 x 450 px';
    this.dimensionDiv.appendChild(this.dimensionValue);

    this.dimensionDropDown = this.buildDropDown('dimensions',this.dimensions, '600 x 450 px');

    this.dimensionDiv.appendChild(this.dimensionDropDown);

    this.iframeTextArea = document.createElement('textarea');
    this.iframeTextArea.setAttribute('class','share-textarea mt10');
    this.iframeTextArea.addEventListener('change',this.shareParamChangedCB.bind(this,'description'));

    this.iframeLabel = document.createElement('div');
    this.iframeLabel.setAttribute('class','share-info');
    this.iframeLabel.innerHTML = 'Copy and paste above code to embed your model.';

    //this.shareBody.appendChild(this.nameLabel);
    //this.shareBody.appendChild(this.nameInput);
    //this.shareBody.appendChild(this.descLabel);
    //this.shareBody.appendChild(this.descTextArea);
    this.shareBody.appendChild(divider);
    this.shareBody.appendChild(this.btnShare);
    this.shareBody.appendChild(this.linkInput);
    this.shareBody.appendChild(this.linkLabel);
    this.shareBody.appendChild(spacer);
    this.shareBody.appendChild(this.btnEmbed);
    this.shareBody.appendChild(this.dimensionDiv);
    this.shareBody.appendChild(this.iframeTextArea);
    this.shareBody.appendChild(this.iframeLabel);

    this.scrollContainer.appendChild(this.closeButton);
    this.scrollContainer.appendChild(this.shareHeader);
    this.scrollContainer.appendChild(this.shareBody);

    this.el.appendChild(this.scrollContainer);

    document.querySelector('#inspectorPanel' + '-' + this.app.appID).appendChild(this.el);
};


Autodesk.Nano.ShareView.prototype._initializeEvents = function _initializeEvents() {
    var self = this,
        args = {},
        shareMenuItems,
        i,
        j;

    this.buildScrollbar = function buildScrollbar(e) {
        if(!e ||  e.modelType ==='mol') {
            self.scrollbar = new Autodesk.Nano.ScrollView(self, self.el, self.scrollContainer, 0);
            self.scrollbar.updateScrollbar();
        }
    };

    this.itemClicked = function itemClicked(event) {
        var val = event.target.innerHTML;
        self.setDimensionParams(val);
        self.dimensionValue.innerHTML = val;
        self.hideShareDropDowns(event);
        document.removeEventListener('click',self.doHideShareDropDowns);
    };

    shareMenuItems = self.app.container.querySelectorAll('.share-drop-down-item');
    for(i = 0; i < shareMenuItems.length; ++i) {
        shareMenuItems[i].addEventListener('click',self.itemClicked);
    }

    this.hideShareDropDowns = function hideShareDropDowns(event) {
        var dropDowns = self.el.querySelectorAll('.share-drop-down'),
            i;

        for (i = 0; i < dropDowns.length; i++) {
            dropDowns[i].classList.remove('visible');
        }
    };

    this.doHideShareDropDowns = function doHideShareDropDowns(event) {
        if (!event.target.classList.contains('share-value')) {
            self.hideShareDropDowns(event);
            document.removeEventListener('click',self.doHideShareDropDowns);
        }
    };

    this.dimensionValueCB = function dimensionValueCB(event) {
        self.hideShareDropDowns();
        self.dimensionDropDown.classList.add('visible');
        document.addEventListener('click', self.doHideShareDropDowns);
    };


    this.dimensionValue.addEventListener('click',self.dimensionValueCB);



    this.selectShareOption = function selectShareOption(targetString,shareOptions) {
        var j;
        for (j = 0; j < shareOptions.length; j++) {
            if (targetString === shareOptions[j].innerHTML) {
                shareOptions[j].classList.add('selected');
            } else {
                shareOptions[j].classList.remove('selected');
            }
        }
    };

    this.getSelections = function getSelection(event) {
        //method for getting selections
    };

    this.toggleInspector = function toggleInspector(forceState) {
        self.app.ViewManager.toggleInspector(forceState);
        self.getNanoManager().viewer.fireEvent({type: Autodesk.Viewing.MENU_SELECTION_UPDATED});
    };
    this.closeButton.addEventListener('click', this.toggleInspector);


    this.updateTitle = function updateTitle() {
        var md = self.getNanoManager().molMetadata;
        self.pdbTitle.innerHTML = self.svfName;
    };

    this.createViewerLink = function createViewerLink(event) {
        self.linkInput.value = event.url +'&tV=presentation';
        self.linkInput.select();
        self.viewer.removeEventListener(Autodesk.Nano.SESSION_SAVED_EVENT,self.createViewerLink);
    };

    this.createViewerFrame = function createViewerFrame(event) {
        var dimensions = self.dimensionValue.innerHTML;
        var width = dimensions.replace(/ x.*$/,'') +'px';
        var height = dimensions.replace(/^.*? x | px$/g,'') + 'px';
        var args = {hideBrowser: false, hideInspector: false, hideHeader: true, disableBrowser: true, disableInspector: true};
        var url = event.url;
        height = height ? height : '550px';
        width = width ? width : '980px';
        self.iframeTextArea.value = '<iframe style = "height: ' + height + '; width: ' + width + ';" src="' + url + '&hB=true&dB=true&hI=true&dI=true&hH=true&viewcube=false&nosplash=true"></iframe>';
        self.iframeTextArea.select();
        self.viewer.removeEventListener(Autodesk.Nano.SESSION_SAVED_EVENT,self.createViewerFrame);
    };

    this.createViewerUrl = function createViewerUrl(url) {
        return location.protocol + '//' + location.host + '/?hB=true&hI=true&session=' + url;
    };

    this.saveSessionLink = function saveSessionLink() {
        //validate current session
        var valid = self.app.ViewManager.getTopView('StateView').validateState();
        self.viewer.addEventListener(Autodesk.Nano.SESSION_SAVED_EVENT,self.createViewerLink);
        if(valid) { //current state === active button state
            self.app.ApiConnector.saveSession();
        } else {
            self.app.ViewManager.createTopView('StateCheckView');
            self.app.ViewManager.getTopView('HeaderView').blink(event);
            window.setTimeout(function() {
                self.app.ViewManager.getTopView('StateCheckView').show();
            },200);
        }

    };

    this.saveSessionFrame = function saveSessionFrame() {
        self.viewer.addEventListener(Autodesk.Nano.SESSION_SAVED_EVENT,self.createViewerFrame);
        self.app.ApiConnector.saveSession();
    };

    this.btnShare.addEventListener('click', this.saveSessionLink);
    this.btnEmbed.addEventListener('click',this.saveSessionFrame);

    this._bindEvents = function _bindEvents() {
        self.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
        // Scrollbars are not created if app is loaded without a model so
        // if there is no scrollbar we add the event listener  that will
        // create the scrollbar instead of updating the viewer object.
        if(self.scrollbar) {
            self.scrollbar.updateViewer(self.viewer);
        } else {
            self.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.buildScrollbar);
        }

    };

    this._unbindEvents = function _unbindEvents() {
        self.viewer.removeEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, self.buildScrollbar);
        self.viewer.removeEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, self._unbindEvents);
    };

    // this.buildScrollbar.bind(this);
    this.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, this.buildScrollbar);
    this.viewer.addEventListener(Autodesk.Viewing.BEFORE_VIEWER_UNINITIALIZED, this._unbindEvents);
};

Autodesk.Nano.ShareView.prototype.buildDropDown = function buildDropDown(name,sourceArray,defaultValue) {
    var i,
        item,
        values = sourceArray,
        len = values.length,
        output = document.createElement('div');
    output.setAttribute('class','share-drop-down');
    output.setAttribute('id',name + 'DropDown');

    for (i = 0; i < len; i++) {
        item = document.createElement('div');
        item.setAttribute('class','share-drop-down-item' + (values[i] === defaultValue ? ' selected' : ''));
        item.setAttribute('id',name + 'DropDown_'+ values[i]);
        item.innerHTML = values[i];
        //item.addEventListener('click',this.itemClicked.bind(this,values[i]));
        output.appendChild(item);
    }

    return output;
};

Autodesk.Nano.ShareView.prototype.shareParamChangedCB = function shareParamChangedCB(param, event) {
    this.shareParams[param] = event.target.value;
};

Autodesk.Nano.ShareView.prototype.modifySwitchCB = function modifySwitchCB() {
    var iv = this.app.ViewManager.getTopView('InspectorView');
    iv.show();
    iv.scrollbar.updateScrollbar();
    this.hide();
};

Autodesk.Nano.ShareView.prototype.setDimensionParams = function setDimensionParams(val) {
    var dimensions = val.split(' x ');
    if (dimensions.length < 2) {
        return false;
    }
    var w = dimensions[0];

    if (val.match(/px/)) {
       w += 'px';
    }
    var h = dimensions[1].replace(/\s/g,'');
    this.shareParams.height = h;
    this.shareParams.width = w;
    return true;
};

Autodesk.Nano.ShareView.prototype.createViewerIFrame = function createViewerIFrame() {
    this.iframeTextArea.value = this.getNanoViewer().getNanoFrame(this.shareParams.width,this.shareParams.height);
    this.iframeTextArea.select();
};

Autodesk.Nano.ShareView.prototype.updateSvfName = function updateSvfName(svfName) {
    this.svfName = svfName;
};

Autodesk.Nano.ShareView.prototype.getNanoManager = function getNanoManager() {
    return this.nanoManager;
};

Autodesk.Nano.ShareView.prototype.getNanoViewer = function getNanoViewer() {
    return this.nanoViewer;
};
;/**
 * Created by andrewkimoto on 5/13/16.
 */

Autodesk.Nano.StateButton = function (id,parentElement,enumerator,parentView,name,active, stateString) {

    var me = Autodesk.Nano.StateButton.prototype;
    this.id = id;
    this.name = name;
    this.active = active ? true : false;
    this.enumerator = enumerator;
    this.parentElement = parentElement;
    this.parentView = parentView;
    this.app = parentView.app;
    this.stateString = stateString;
    this._initialize();
};

Autodesk.Nano.StateButton.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.StateButton.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.StateButton.prototype.destructor = function destructor() {
    this.el.innerHTML = '';
    this.el.remove();
};

Autodesk.Nano.StateButton.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('li');
    this.el.setAttribute('id','state-'+ this.id);
    this.el.setAttribute('class','state-button');
    if (this.active) {
        this.el.classList.add('active');
    }
    this.text = document.createElement('input');
    this.text.setAttribute('value', 'Snapshot '+this.enumerator);
    if (this.name) {
        this.text.value = this.name;
    }

    this.updateButton = document.createElement('div');
    this.updateButton.setAttribute('class','btn-update-state');
    this.updateButton.innerHTML = 'update';
    this.closeButton = document.createElement('div');
    this.closeButton.setAttribute('class','btn-close-state');

    this.el.appendChild(this.text);
    this.el.appendChild(this.updateButton);
    this.el.appendChild(this.closeButton);


    this.parentElement.appendChild(this.el);
};

Autodesk.Nano.StateButton.prototype._initializeEvents = function _initializeEvents() {
    var self = this;
    if (!this.stateString) {
        this.stateString = this.app.StateManager.getSnapshot();
    }

    this.setActive = function setActive(active) {
        self.active = active;
        if(active) {
            self.el.classList.add('active');
        } else {
            self.el.classList.remove('active');
        }
    };

    this.loadState = function loadState() {
        this.app.StateManager.restoreSnapshot(this.stateString);
        self.parentView.deselectStateButtons();
        self.setActive(true);
    };

    this.textClick = function textClick(event) {
        this.text.select();
        event.stopPropagation();
    };

    this.closeClick = function closeClick(event) {
        self.parentView.removeStateButton.call(self.parentView,self.id);
        event.stopPropagation();

    };

    this.resetButton = function resetButton() {
        self.el.style.backgroundColor = '';
        self.updateButton.innerHTML = 'update';
    };

    this.updateClick = function updateClick(event) {
        self.el.style.backgroundColor = '#2FD48C';
        self.updateButton.innerHTML = 'updating snapshot';
        self.parentView.updateStateButton.call(self.parentView,self.id);
        window.setTimeout(self.resetButton,2000);
    };

    this.loadStateBind = this.loadState.bind(this);
    this.textClickBind = this.textClick.bind(this);
    this.dropOrderBind = this.parentView.dropOrder.bind(this.parentView);
    //this.closeClickBind = this.closeClick

    this.el.addEventListener('click', this.loadStateBind);
    this.el.addEventListener('drop', this.dropOrderBind);

    this.text.addEventListener('click',this.textClickBind);

    this.closeButton.addEventListener('click',this.closeClick);
    this.updateButton.addEventListener('click',this.updateClick);
};
;/**
 * Created by andrewkimoto on 5/13/16.
 */

Autodesk.Nano.StateView = function (args) {

    var me = Autodesk.Nano.StateView.prototype;
    this.app = args.app;
    this.molViewer = args.app.MolViewer;
    this.stateManager = args.app.StateManager;
    this.viewer = args.viewer;
    this.type = 'StateView';
    this.parentElement = this.app.container.querySelector(args.parentElement);
    this.stateButtons = [];
    this.nextButton = 1;
    this._initialize();
};

Autodesk.Nano.StateView.prototype = Object.create(Autodesk.Nano.TopView.prototype);

Autodesk.Nano.StateView.prototype._initialize = function _initialize() {
    var me = Autodesk.Nano.StateView.prototype;
    me._initializeElements.call(this);
    me._initializeEvents.call(this);
};

Autodesk.Nano.StateView.prototype.destructor = function destructor() {
    this.el.innerHTML = '';
    this.el.remove();
    this.app.ViewManager.destroyTopView(this);
};

Autodesk.Nano.StateView.prototype._initializeElements = function _initializeElements() {
    this.el = document.createElement('DIV');
    this.el.setAttribute('id','statePanel');
    this.list = document.createElement('ul');
    this.list.classList.add('state-list');
    this.listContainer = document.createElement('div');
    this.listContainer.setAttribute('class','browser-wrapper no-padding no-top-border');
    this.listContainer.setAttribute('id','stateButtonContainer');
    this.sortable = Sortable.create(this.list);
    this.listContainer.appendChild(this.list);
    this.el.appendChild(this.listContainer);
    this.stateButton = document.createElement('div');
    this.stateButton.setAttribute('id','btnSnapshot');
    this.stateButton.innerHTML = 'Take Snapshot';
    this.el.appendChild(this.stateButton);
    this.parentElement.appendChild(this.el);
};



Autodesk.Nano.StateView.prototype._initializeEvents = function _initializeEvents() {
    var self = this;
    this.buildScrollbar = function buildScrollbar(e) {
        if(!e || typeof e.modelType === 'string') {
            if (!self.scrollbar) {
                self.scrollbar = new Autodesk.Nano.ScrollView(self, self.el, self.listContainer,0, 29);
            }
        }
    };

    this.takeSnapshot = function takeSnapshot() {
        this.addStateButton(THREE.Math.generateUUID(),false,this.stateManager.getSnapshot(), true, false);
    };

    this.takeSnapshotBind = this.takeSnapshot.bind(this);
    this.removeStateButtonsBind = this.removeStateButtons.bind(this);

    this.stateButton.addEventListener('click',this.takeSnapshotBind);

    this._bindEvents = function _bindEvents() {
        self.viewer.addEventListener(Autodesk.Nano.MODEL_DELETED_EVENT, self.removeStateButtonsBind);

    };

    this._unbindEvents = function _unbindEvents() {
        self.viewer.removeEventListener(Autodesk.Nano.MODEL_DELETED_EVENT, self.removeStateButtonsBind);
    };

    this.viewer.addEventListener(Autodesk.Nano.MODEL_START_LOADED_EVENT, this.buildScrollbar);
    this.viewer.addEventListener(Autodesk.Nano.MODEL_DELETED_EVENT, this.removeStateButtonsBind);
};




Autodesk.Nano.StateView.prototype.addStateButton = function addStateButton(id, name, stateString, active, restored) {
    var stateButton = new Autodesk.Nano.StateButton(id,this.list,this.nextButton,this, name, active, stateString);
    this.stateButtons.push(stateButton);
    this.nextButton += 1;
    if(!restored) {
        this.deselectStateButtons();
        stateButton.text.focus();
        stateButton.text.select();
        stateButton.setActive(true);
    }

    if(this.scrollbar) {
        this.scrollbar.updateScrollbar();
        this.scrollbar.scrollBottom();
        if (this.scrollbar.el.style.display === 'block') {
            this.list.classList.add('scrollable');
        } else {
            this.list.classList.remove('scrollable');
        }
    }
    //resize the browser panels when we add state buttons
    this.viewer.fireEvent(Autodesk.Viewing.BROWSER_RESIZED_EVENT);
};

Autodesk.Nano.StateView.prototype.removeStateButton = function removeStateButton(id) {
    var stateButtonInfo = this.getStateButtonInfo(id);
    if (stateButtonInfo) {
        stateButtonInfo.button.destructor();
        this.stateButtons.splice(stateButtonInfo.index,1);
        //delete this.stateButtons[id];
        if (this.stateButtons.length === 0) { //no more stateButtons
            this.el.classList.remove('active');
        }
        if (this.scrollbar) {
            this.scrollbar.resetScrollbar();
            if (this.scrollbar.el.style.display === 'block') {
                this.list.classList.add('scrollable');
            } else {
                this.list.classList.remove('scrollable');
            }
        }
    }
};

Autodesk.Nano.StateView.prototype.updateStateButton = function updateStateButton(id) {
    var buttonInfo = this.getStateButtonInfo(id);
    buttonInfo.button.stateString = this.stateManager.getSnapshot();
};

Autodesk.Nano.StateView.prototype.deselectStateButtons = function deselectStateButtons() {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        this.stateButtons[i].active = false;
        this.stateButtons[i].el.classList.remove('active');
    }
};

//find the stateButton in the array, return the button and its index
//as an object
Autodesk.Nano.StateView.prototype.getStateButtonInfo = function getStateButtonInfo(id) {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        if (this.stateButtons[i].id === id) {

            return {button: this.stateButtons[i], index: i};
        }
    }
    return false; //not found
};

//restore buttons from button array
Autodesk.Nano.StateView.prototype.restoreStateButtons = function restoreStateButtons(buttonData) {
    var i,
        button;
    // remove existing buttons
    if (this.stateButtons.length > 0) {
        this.removeStateButtons();
    }

    for (i = 0; i < buttonData.length; ++i) {
        button = this.addStateButton(buttonData[i].id, buttonData[i].name, buttonData[i].state, buttonData[i].active, true);
    }
};

Autodesk.Nano.StateView.prototype.removeStateButtons = function removeStateButtons() {
    var i;
    while (this.stateButtons.length > 0) {
        this.removeStateButton(this.stateButtons[0].id);
    }
};

Autodesk.Nano.StateView.prototype.getActiveStateButton = function getActiveStateButton() {
    var i;
    for (i = 0; i < this.stateButtons.length; ++i) {
        if (this.stateButtons[i].active ) {
            return this.stateButtons[i];
        }
    }
    return false;
};

Autodesk.Nano.StateView.prototype.validateState = function validateState() {
    var state = JSON.stringify(this.molViewer.getMolViewerState());
    var currentState = LZString144.compressToEncodedURIComponent(state);
    var activeButton = this.getActiveStateButton();
    var activeState;
    if (!activeButton) {
        return true; // this should never happen unless there are no snapshots
    }
    activeState = activeButton.stateString;
    if (activeState === currentState) {
        return true;
    }
    return false;
};

//reorder the state buttons
// not sure if we will make the state buttons an array of objects or
// just add an order tag to an object hash
Autodesk.Nano.StateView.prototype.dropOrder = function dropOrder(event) {
    var srcElement = event.srcElement.classList.contains('state-button') ? event.srcElement : event.srcElement.parentElement;
    var movedInfo = this.getStateButtonInfo(srcElement.id.replace(/^state-/,''));
    var moved = this.stateButtons.splice(movedInfo.index,1);
    if(!moved) {
        return false;
    }
    var domNodes = this.list.querySelectorAll('.state-button');
    var i,
        j;
    for (i = 0; i < domNodes.length; ++i) {
        if (domNodes[i].id.replace(/^state-/,'') === moved[0].id) {
            j = i;
            this.stateButtons.splice(j,0,moved[0]);
            return true;
        }
    }
    return false;
};;/**
 * @author arodic / https://github.com/arodic
 *
 * @author chiena -- Modified for Autodesk LMV web viewer
 */
 /*jshint sub:true*/

window.init_TransformGizmos = function init_TransformGizmos() {

    'use strict';

    var GizmoMaterial = function ( parameters ) {

        THREE.MeshBasicMaterial.call( this );

        this.depthTest = false;
        this.depthWrite = false;
        this.side = THREE.FrontSide;
        this.transparent = true;

        this.setValues( parameters );

        this.oldColor = this.color.clone();
        this.oldOpacity = this.opacity;

        this.highlight = function( highlighted ) {

            if ( highlighted ) {

                this.color.setRGB( 1, 230/255, 3/255 );
                this.opacity = 1;

            } else {

                this.color.copy( this.oldColor );
                this.opacity = this.oldOpacity;

            }

        };

    };

    GizmoMaterial.prototype = Object.create( THREE.MeshBasicMaterial.prototype );

    var GizmoLineMaterial = function ( parameters ) {

        THREE.LineBasicMaterial.call( this );

        this.depthTest = false;
        this.depthWrite = false;
        this.transparent = true;
        this.linewidth = 1;

        this.setValues( parameters );

        this.oldColor = this.color.clone();
        this.oldOpacity = this.opacity;

        this.highlight = function( highlighted ) {

            if ( highlighted ) {

                this.color.setRGB( 1, 230/255, 3/255 );
                this.opacity = 1;

            } else {

                this.color.copy( this.oldColor );
                this.opacity = this.oldOpacity;

            }

        };

    };

    GizmoLineMaterial.prototype = Object.create( THREE.LineBasicMaterial.prototype );

    // polyfill
    if (THREE.PolyhedronGeometry === undefined) {
        THREE.PolyhedronGeometry = function ( vertices, indices, radius, detail ) {

            THREE.Geometry.call( this );

            this.type = 'PolyhedronGeometry';

            this.parameters = {
                vertices: vertices,
                indices: indices,
                radius: radius,
                detail: detail
            };

            radius = radius || 1;
            detail = detail || 0;

            var that = this;

            for ( var i = 0, l = vertices.length; i < l; i += 3 ) {

                prepare( new THREE.Vector3( vertices[ i ], vertices[ i + 1 ], vertices[ i + 2 ] ) );

            }

            var midpoints = [], p = this.vertices;

            var faces = [];

            for ( var i = 0, j = 0, l = indices.length; i < l; i += 3, j ++ ) {

                var v1 = p[ indices[ i     ] ];
                var v2 = p[ indices[ i + 1 ] ];
                var v3 = p[ indices[ i + 2 ] ];

                faces[ j ] = new THREE.Face3( v1.index, v2.index, v3.index, [ v1.clone(), v2.clone(), v3.clone() ] );

            }

            var centroid = new THREE.Vector3();

            for ( var i = 0, l = faces.length; i < l; i ++ ) {

                subdivide( faces[ i ], detail );

            }


            // Handle case when face straddles the seam

            for ( var i = 0, l = this.faceVertexUvs[ 0 ].length; i < l; i ++ ) {

                var uvs = this.faceVertexUvs[ 0 ][ i ];

                var x0 = uvs[ 0 ].x;
                var x1 = uvs[ 1 ].x;
                var x2 = uvs[ 2 ].x;

                var max = Math.max( x0, Math.max( x1, x2 ) );
                var min = Math.min( x0, Math.min( x1, x2 ) );

                if ( max > 0.9 && min < 0.1 ) { // 0.9 is somewhat arbitrary

                    if ( x0 < 0.2 ) uvs[ 0 ].x += 1;
                    if ( x1 < 0.2 ) uvs[ 1 ].x += 1;
                    if ( x2 < 0.2 ) uvs[ 2 ].x += 1;

                }

            }


            // Apply radius

            for ( var i = 0, l = this.vertices.length; i < l; i ++ ) {

                this.vertices[ i ].multiplyScalar( radius );

            }


            // Merge vertices

            this.mergeVertices();

            this.computeFaceNormals();

            this.boundingSphere = new THREE.Sphere( new THREE.Vector3(), radius );


            // Project vector onto sphere's surface

            function prepare( vector ) {

                var vertex = vector.normalize().clone();
                vertex.index = that.vertices.push( vertex ) - 1;

                // Texture coords are equivalent to map coords, calculate angle and convert to fraction of a circle.

                var u = azimuth( vector ) / 2 / Math.PI + 0.5;
                var v = inclination( vector ) / Math.PI + 0.5;
                vertex.uv = new THREE.Vector2( u, 1 - v );

                return vertex;

            }


            // Approximate a curved face with recursively sub-divided triangles.

            function make( v1, v2, v3 ) {

                var face = new THREE.Face3( v1.index, v2.index, v3.index, [ v1.clone(), v2.clone(), v3.clone() ] );
                that.faces.push( face );

                centroid.copy( v1 ).add( v2 ).add( v3 ).divideScalar( 3 );

                var azi = azimuth( centroid );

                that.faceVertexUvs[ 0 ].push( [
                    correctUV( v1.uv, v1, azi ),
                    correctUV( v2.uv, v2, azi ),
                    correctUV( v3.uv, v3, azi )
                ] );

            }


            // Analytically subdivide a face to the required detail level.

            function subdivide( face, detail ) {

                var cols = Math.pow(2, detail);
                var cells = Math.pow(4, detail);
                var a = prepare( that.vertices[ face.a ] );
                var b = prepare( that.vertices[ face.b ] );
                var c = prepare( that.vertices[ face.c ] );
                var v = [];

                // Construct all of the vertices for this subdivision.

                for ( var i = 0 ; i <= cols; i ++ ) {

                    v[ i ] = [];

                    var aj = prepare( a.clone().lerp( c, i / cols ) );
                    var bj = prepare( b.clone().lerp( c, i / cols ) );
                    var rows = cols - i;

                    for ( var j = 0; j <= rows; j ++) {

                        if ( j == 0 && i == cols ) {

                            v[ i ][ j ] = aj;

                        } else {

                            v[ i ][ j ] = prepare( aj.clone().lerp( bj, j / rows ) );

                        }

                    }

                }

                // Construct all of the faces.

                for ( var i = 0; i < cols ; i ++ ) {

                    for ( var j = 0; j < 2 * (cols - i) - 1; j ++ ) {

                        var k = Math.floor( j / 2 );

                        if ( j % 2 == 0 ) {

                            make(
                                v[ i ][ k + 1],
                                v[ i + 1 ][ k ],
                                v[ i ][ k ]
                            );

                        } else {

                            make(
                                v[ i ][ k + 1 ],
                                v[ i + 1][ k + 1],
                                v[ i + 1 ][ k ]
                            );

                        }

                    }

                }

            }


            // Angle around the Y axis, counter-clockwise when looking from above.

            function azimuth( vector ) {

                return Math.atan2( vector.z, - vector.x );

            }


            // Angle above the XZ plane.

            function inclination( vector ) {

                return Math.atan2( - vector.y, Math.sqrt( ( vector.x * vector.x ) + ( vector.z * vector.z ) ) );

            }


            // Texture fixing helper. Spheres have some odd behaviours.

            function correctUV( uv, vector, azimuth ) {

                if ( ( azimuth < 0 ) && ( uv.x === 1 ) ) uv = new THREE.Vector2( uv.x - 1, uv.y );
                if ( ( vector.x === 0 ) && ( vector.z === 0 ) ) uv = new THREE.Vector2( azimuth / 2 / Math.PI + 0.5, uv.y );
                return uv.clone();

            }

        };

        THREE.PolyhedronGeometry.prototype = Object.create( THREE.Geometry.prototype );
    }

    // polyfill
    if (THREE.OctahedronGeometry === undefined) {
        THREE.OctahedronGeometry = function ( radius, detail ) {

            this.parameters = {
                radius: radius,
                detail: detail
            };

            var vertices = [
                1, 0, 0,   - 1, 0, 0,    0, 1, 0,    0,- 1, 0,    0, 0, 1,    0, 0,- 1
            ];

            var indices = [
                0, 2, 4,    0, 4, 3,    0, 3, 5,    0, 5, 2,    1, 2, 5,    1, 5, 3,    1, 3, 4,    1, 4, 2
            ];

            THREE.PolyhedronGeometry.call( this, vertices, indices, radius, detail );

            this.type = 'OctahedronGeometry';

            this.parameters = {
                radius: radius,
                detail: detail
            };
        };

        THREE.OctahedronGeometry.prototype = Object.create( THREE.Geometry.prototype );
    }

    // polyfill
    if (THREE.TorusGeometry === undefined) {
        THREE.TorusGeometry = function ( radius, tube, radialSegments, tubularSegments, arc ) {

            THREE.Geometry.call( this );

            this.type = 'TorusGeometry';

            this.parameters = {
                radius: radius,
                tube: tube,
                radialSegments: radialSegments,
                tubularSegments: tubularSegments,
                arc: arc
            };

            radius = radius || 100;
            tube = tube || 40;
            radialSegments = radialSegments || 8;
            tubularSegments = tubularSegments || 6;
            arc = arc || Math.PI * 2;

            var center = new THREE.Vector3(), uvs = [], normals = [];

            for ( var j = 0; j <= radialSegments; j ++ ) {

                for ( var i = 0; i <= tubularSegments; i ++ ) {

                    var u = i / tubularSegments * arc;
                    var v = j / radialSegments * Math.PI * 2;

                    center.x = radius * Math.cos( u );
                    center.y = radius * Math.sin( u );

                    var vertex = new THREE.Vector3();
                    vertex.x = ( radius + tube * Math.cos( v ) ) * Math.cos( u );
                    vertex.y = ( radius + tube * Math.cos( v ) ) * Math.sin( u );
                    vertex.z = tube * Math.sin( v );

                    this.vertices.push( vertex );

                    uvs.push( new THREE.Vector2( i / tubularSegments, j / radialSegments ) );
                    normals.push( vertex.clone().sub( center ).normalize() );

                }

            }

            for ( var j = 1; j <= radialSegments; j ++ ) {

                for ( var i = 1; i <= tubularSegments; i ++ ) {

                    var a = ( tubularSegments + 1 ) * j + i - 1;
                    var b = ( tubularSegments + 1 ) * ( j - 1 ) + i - 1;
                    var c = ( tubularSegments + 1 ) * ( j - 1 ) + i;
                    var d = ( tubularSegments + 1 ) * j + i;

                    var face = new THREE.Face3( a, b, d, [ normals[ a ].clone(), normals[ b ].clone(), normals[ d ].clone() ] );
                    this.faces.push( face );
                    this.faceVertexUvs[ 0 ].push( [ uvs[ a ].clone(), uvs[ b ].clone(), uvs[ d ].clone() ] );

                    face = new THREE.Face3( b, c, d, [ normals[ b ].clone(), normals[ c ].clone(), normals[ d ].clone() ] );
                    this.faces.push( face );
                    this.faceVertexUvs[ 0 ].push( [ uvs[ b ].clone(), uvs[ c ].clone(), uvs[ d ].clone() ] );

                }

            }

            this.computeFaceNormals();

        };

        THREE.TorusGeometry.prototype = Object.create( THREE.Geometry.prototype );
    }

    var createCircleGeometry = function ( radius, facing, arc ) {

        var geometry = new THREE.Geometry();
        arc = arc ? arc : 1;
        for ( var i = 0; i <= 64 * arc; ++i ) {
            if ( facing == 'x' ) geometry.vertices.push( new THREE.Vector3( 0, Math.cos( i / 32 * Math.PI ), Math.sin( i / 32 * Math.PI ) ).multiplyScalar(radius) );
            if ( facing == 'y' ) geometry.vertices.push( new THREE.Vector3( Math.cos( i / 32 * Math.PI ), 0, Math.sin( i / 32 * Math.PI ) ).multiplyScalar(radius) );
            if ( facing == 'z' ) geometry.vertices.push( new THREE.Vector3( Math.sin( i / 32 * Math.PI ), Math.cos( i / 32 * Math.PI ), 0 ).multiplyScalar(radius) );
        }

        return geometry;
    };

    var createArrowGeometry = function ( radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded ) {

        var arrowGeometry = new THREE.Geometry();
        var mesh = new THREE.Mesh( new THREE.CylinderGeometry( radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded ) );
        mesh.position.y = 0.5;
        mesh.updateMatrix();

        arrowGeometry.merge( mesh.geometry, mesh.matrix );

        return arrowGeometry;
    };

    var createLineGeometry = function ( axis ) {

        var lineGeometry = new THREE.Geometry();
        if ( axis === 'X') 
            lineGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 1, 0, 0 ) );
        else if ( axis === 'Y' ) 
            lineGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 1, 0 ) );
        else if ( axis === 'Z' )
            lineGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 1 ) );

        return lineGeometry;
    };

    THREE.TransformGizmo = function () {

        var scope = this;
        var showPickers = false; //debug
        var showActivePlane = false; //debug

        this.init = function () {

            THREE.Object3D.call( this );

            this.handles = new THREE.Object3D();
            this.pickers = new THREE.Object3D();
            this.planes = new THREE.Object3D();
            this.highlights = new THREE.Object3D();
            this.hemiPicker = new THREE.Object3D();
            this.subPickers = new THREE.Object3D();

            this.add(this.handles);
            this.add(this.pickers);
            this.add(this.planes);
            this.add(this.highlights);
            this.add(this.hemiPicker);
            this.add(this.subPickers);

            //// PLANES

            var planeGeometry = new THREE.PlaneBufferGeometry( 50, 50, 2, 2 );
            var planeMaterial = new THREE.MeshBasicMaterial( { wireframe: true } );
            planeMaterial.side = THREE.DoubleSide;

            var planes = {
                "XY":   new THREE.Mesh( planeGeometry, planeMaterial ),
                "YZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
                "XZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
                "XYZE": new THREE.Mesh( planeGeometry, planeMaterial )
            };

            this.activePlane = planes["XYZE"];

            planes["YZ"].rotation.set( 0, Math.PI/2, 0 );
            planes["XZ"].rotation.set( -Math.PI/2, 0, 0 );

            for (var i in planes) {
                planes[i].name = i;
                this.planes.add(planes[i]);
                this.planes[i] = planes[i];
                planes[i].visible = false;
            }

            this.setupGizmos();
            this.activeMode = "";

            // reset Transformations

            this.traverse(function ( child ) {
                if (child instanceof THREE.Mesh) {
                    child.updateMatrix();

                    var tempGeometry = new THREE.Geometry();
                    if (child.geometry instanceof THREE.BufferGeometry) {
                        child.geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
                    }
                    tempGeometry.merge( child.geometry, child.matrix );

                    child.geometry = tempGeometry;
                    child.position.set( 0, 0, 0 );
                    child.rotation.set( 0, 0, 0 );
                    child.scale.set( 1, 1, 1 );
                }
            });

        };

        this.hide = function () {
            this.traverse(function( child ) {
                child.visible = false;
            });
        };

        this.show = function () {
            this.traverse(function( child ) {
                child.visible = true;
                if (child.parent == scope.pickers || child.parent == scope.hemiPicker ) child.visible = showPickers;
                if (child.parent == scope.planes ) child.visible = false;
            });
            this.activePlane.visible = showActivePlane;
        };

        this.highlight = function ( axis ) {
            this.traverse(function( child ) {
                if ( child.material && child.material.highlight ) {
                    if ( child.name == axis ) {
                        child.material.highlight( true );
                    } else {
                        child.material.highlight( false );
                    }
                }
            });
        };

        this.setupGizmos = function () {

            var addGizmos = function( gizmoMap, parent ) {

                for ( var name in gizmoMap ) {

                    for ( var i = gizmoMap[name].length; i--;) {

                        var object = gizmoMap[name][i][0];
                        var position = gizmoMap[name][i][1];
                        var rotation = gizmoMap[name][i][2];
                        var visble = gizmoMap[name][i][3];

                        object.name = name;

                        if ( position ) object.position.set( position[0], position[1], position[2] );
                        if ( rotation ) object.rotation.set( rotation[0], rotation[1], rotation[2] );
                        if ( visble ) object.visble = visble;

                        parent.add( object );

                    }

                }

            };

            this.setHandlePickerGizmos();

            addGizmos(this.handleGizmos, this.handles);
            addGizmos(this.pickerGizmos, this.pickers);
            addGizmos(this.highlightGizmos, this.highlights);
            addGizmos(this.hemiPickerGizmos, this.hemiPicker);
            addGizmos(this.subPickerGizmos, this.subPickers);

            this.hide();
            this.show();

        };

    };

    THREE.TransformGizmo.prototype = Object.create( THREE.Object3D.prototype );

    THREE.TransformGizmo.prototype.update = function ( rotation, eye ) {

        var vec1 = new THREE.Vector3( 0, 0, 0 );
        var vec2 = new THREE.Vector3( 0, 1, 0 );
        var lookAtMatrix = new THREE.Matrix4();

        this.traverse(function(child) {
            if ( child.name ) {
                if ( child.name.search("E") != -1 ) {
                    child.quaternion.setFromRotationMatrix( lookAtMatrix.lookAt( eye, vec1, vec2 ) );
                } else if ( child.name.search("X") != -1 || child.name.search("Y") != -1 || child.name.search("Z") != -1 ) {
                    child.quaternion.setFromEuler( rotation );
                }
            }
        });

    };

    THREE.TransformGizmoTranslate = function () {

        THREE.TransformGizmo.call( this );

        this.setHandlePickerGizmos = function () {

            var arrowGeometry = createArrowGeometry( 0, 0.05, 0.2, 12, 1, false );
            var lineXGeometry = createLineGeometry( 'X' );
            var lineYGeometry = createLineGeometry( 'Y' );
            var lineZGeometry = createLineGeometry( 'Z' );

            this.handleGizmos = {
                X: [
                    [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xf12c2c } ) ), [ 0.5, 0, 0 ], [ 0, 0, -Math.PI/2 ] ],
                    [ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: 0xf12c2c } ) ) ]
                ],
                Y: [
                    [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x0bb80b } ) ), [ 0, 0.5, 0 ] ],
                    [   new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: 0x0bb80b } ) ) ]
                ],
                Z: [
                    [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x2c2cf1 } ) ), [ 0, 0, 0.5 ], [ Math.PI/2, 0, 0 ] ],
                    [ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: 0x2c2cf1 } ) ) ]
                ],
                XYZ: [
                    [ new THREE.Mesh( new THREE.OctahedronGeometry( 0.1, 0 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ 0, 0, 0 ] ]
                ],
                XY: [
                    [ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0xffff00, opacity: 0.25 } ) ), [ 0.15, 0.15, 0 ] ]
                ],
                YZ: [
                    [ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0x00ffff, opacity: 0.25 } ) ), [ 0, 0.15, 0.15 ], [ 0, Math.PI/2, 0 ] ]
                ],
                XZ: [
                    [ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0xff00ff, opacity: 0.25 } ) ), [ 0.15, 0, 0.15 ], [ -Math.PI/2, 0, 0 ] ]
                ]
            };

            this.pickerGizmos = {
                X: [
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), new GizmoMaterial( { color: 0xff0000, opacity: 0.25 } ) ), [ 0.6, 0, 0 ], [ 0, 0, -Math.PI/2 ] ]
                ],
                Y: [
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), new GizmoMaterial( { color: 0x00ff00, opacity: 0.25 } ) ), [ 0, 0.6, 0 ] ]
                ],
                Z: [
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0.6 ], [ Math.PI/2, 0, 0 ] ]
                ],
                XYZ: [
                    [ new THREE.Mesh( new THREE.OctahedronGeometry( 0.2, 0 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
                ],
                XY: [
                    [ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), new GizmoMaterial( { color: 0xffff00, opacity: 0.25 } ) ), [ 0.2, 0.2, 0 ] ]
                ],
                YZ: [
                    [ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), new GizmoMaterial( { color: 0x00ffff, opacity: 0.25 } ) ), [ 0, 0.2, 0.2 ], [ 0, Math.PI/2, 0 ] ]
                ],
                XZ: [
                    [ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), new GizmoMaterial( { color: 0xff00ff, opacity: 0.25 } ) ), [ 0.2, 0, 0.2 ], [ -Math.PI/2, 0, 0 ] ]
                ]
            };

            this.hemiPickerGizmos = {
                XYZ: [
                    [ new THREE.Mesh( new THREE.BoxGeometry( 1.2, 1.2, 1.2 ), new GizmoMaterial( { color: 0x0000ff } ) ), [ 0.5, 0.5, 0.5 ], null, false ]
                ]
            };

        };

        this.setActivePlane = function ( axis, eye ) {

            var tempMatrix = new THREE.Matrix4();
            eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

            if ( axis == "X" ) {
                this.activePlane = this.planes[ "XY" ];
                if ( Math.abs(eye.y) > Math.abs(eye.z) ) this.activePlane = this.planes[ "XZ" ];
            }

            if ( axis == "Y" ){
                this.activePlane = this.planes[ "XY" ];
                if ( Math.abs(eye.x) > Math.abs(eye.z) ) this.activePlane = this.planes[ "YZ" ];
            }

            if ( axis == "Z" ){
                this.activePlane = this.planes[ "XZ" ];
                if ( Math.abs(eye.x) > Math.abs(eye.y) ) this.activePlane = this.planes[ "YZ" ];
            }

            if ( axis == "XYZ" ) this.activePlane = this.planes[ "XYZE" ];

            if ( axis == "XY" ) this.activePlane = this.planes[ "XY" ];

            if ( axis == "YZ" ) this.activePlane = this.planes[ "YZ" ];

            if ( axis == "XZ" ) this.activePlane = this.planes[ "XZ" ];

            this.hide();
            this.show();

        };

        this.init();

    };

    THREE.TransformGizmoTranslate.prototype = Object.create( THREE.TransformGizmo.prototype );

    THREE.TransformGizmoRotate = function () {

        THREE.TransformGizmo.call( this );

        this.setHandlePickerGizmos = function () {

            this.handleGizmos = {
                RX: [
                    [ new THREE.Line( createCircleGeometry(1,'x',0.5), new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
                ],
                RY: [
                    [ new THREE.Line( createCircleGeometry(1,'y',0.5), new GizmoLineMaterial( { color: 0x00ff00 } ) ) ]
                ],
                RZ: [
                    [ new THREE.Line( createCircleGeometry(1,'z',0.5), new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
                ],
                RE: [
                    [ new THREE.Line( createCircleGeometry(1.25,'z',1), new GizmoLineMaterial( { color: 0x00ffff } ) ) ]
                ],
                RXYZE: [
                    [ new THREE.Line( createCircleGeometry(1,'z',1), new GizmoLineMaterial( { color: 0xff00ff } ) ) ]
                ]
            };

            this.pickerGizmos = {
                RX: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 4, 12, Math.PI ), new GizmoMaterial( { color: 0xff0000, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ 0, -Math.PI/2, -Math.PI/2 ] ]
                ],
                RY: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 4, 12, Math.PI ), new GizmoMaterial( { color: 0x00ff00, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ Math.PI/2, 0, 0 ] ]
                ],
                RZ: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 4, 12, Math.PI ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ 0, 0, -Math.PI/2 ] ]
                ],
                RE: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1.25, 0.12, 2, 24 ), new GizmoMaterial( { color: 0x00ffff, opacity: 0.25 } ) ) ]
                ],
                RXYZE: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 2, 24 ), new GizmoMaterial( { color: 0xff00ff, opacity: 0.25 } ) ) ]
                ]
            };

        };

        this.setActivePlane = function ( axis ) {

            if ( axis == "RE" ) this.activePlane = this.planes[ "XYZE" ];

            if ( axis == "RX" ) this.activePlane = this.planes[ "YZ" ];

            if ( axis == "RY" ) this.activePlane = this.planes[ "XZ" ];

            if ( axis == "RZ" ) this.activePlane = this.planes[ "XY" ];

            this.hide();
            this.show();

        };

        this.update = function ( rotation, eye2 ) {

            THREE.TransformGizmo.prototype.update.apply( this, arguments );

            var tempMatrix = new THREE.Matrix4();
            var worldRotation = new THREE.Euler( 0, 0, 1 );
            var tempQuaternion = new THREE.Quaternion();
            var unitX = new THREE.Vector3( 1, 0, 0 );
            var unitY = new THREE.Vector3( 0, 1, 0 );
            var unitZ = new THREE.Vector3( 0, 0, 1 );
            var quaternionX = new THREE.Quaternion();
            var quaternionY = new THREE.Quaternion();
            var quaternionZ = new THREE.Quaternion();
            var eye = eye2.clone();

            worldRotation.copy( this.planes["XY"].rotation );
            tempQuaternion.setFromEuler( worldRotation );

            tempMatrix.makeRotationFromQuaternion( tempQuaternion ).getInverse( tempMatrix );
            eye.applyMatrix4( tempMatrix );

            this.traverse(function(child) {

                tempQuaternion.setFromEuler( worldRotation );

                if ( child.name == "RX" ) {
                    quaternionX.setFromAxisAngle( unitX, Math.atan2( -eye.y, eye.z ) );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
                    child.quaternion.copy( tempQuaternion );
                }

                if ( child.name == "RY" ) {
                    quaternionY.setFromAxisAngle( unitY, Math.atan2( eye.x, eye.z ) );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
                    child.quaternion.copy( tempQuaternion );
                }

                if ( child.name == "RZ" ) {
                    quaternionZ.setFromAxisAngle( unitZ, Math.atan2( eye.y, eye.x ) );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );
                    child.quaternion.copy( tempQuaternion );
                }

            });

        };

        this.init();

    };

    THREE.TransformGizmoRotate.prototype = Object.create( THREE.TransformGizmo.prototype );

    THREE.TransformGizmoTranslateRotate = function () {

        THREE.TransformGizmo.call( this );

        var scope = this;

        this.setHandlePickerGizmos = function () {

            var arrowGeometry = createArrowGeometry( 0, 0.05, 0.2, 12, 1, false );
            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push( new THREE.Vector3( 0, 0, -0.1 ), new THREE.Vector3( 0, 0, 0.1 ), new THREE.Vector3( -0.1, 0, 0 ), new THREE.Vector3( 0.1, 0, 0 ) );
            var theta = 0.15;

            this.handleGizmos = {
                Z: [
                    [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xffffff } ) ), [ 0, 0, 0.25 ], [ Math.PI/2, 0, 0 ] ],
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.015, 0.015, 0.6, 4, 1, false ), new GizmoMaterial( { color: 0xffffff } ) ), [ 0, 0, 0.5 ],[ Math.PI/2, 0, 0 ] ]
                ],
                RX: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.015, 12, 60, theta * 2 * Math.PI ), new GizmoMaterial( { color: 0xff0000 } ) ), [ 0, 0, 0 ], [ theta * Math.PI, -Math.PI/2, 0 ] ],
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.05, 0.05, 0.015, 60, 1, false ), new GizmoMaterial( { color: 0xff0000 } ) ), [ 0, 0, 1 ], [ Math.PI/2, 0, 0 ] ]
                ],
                RY: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.015, 12, 60, theta * 2 * Math.PI ), new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 0 ], [ Math.PI/2, 0, (0.5-theta)*Math.PI ] ],
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.05, 0.05, 0.01, 60, 1, false ), new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 1 ] ]
                ]
            };

            this.pickerGizmos = {
                Z: [
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.12, 0.12, 0.65, 4, 1, false ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0.5 ], [ Math.PI/2, 0, 0 ] ]
                ],
                RX: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 4, 12, theta * 2 * Math.PI ), new GizmoMaterial( { color: 0xff0000, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ theta * Math.PI, -Math.PI/2, 0 ] ]
                ],
                RY: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.12, 4, 12, theta * 2 * Math.PI ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ Math.PI/2, 0, (0.5-theta)*Math.PI ] ]
                ]
            };

            this.subPickerGizmos = {
                Z: [
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.12, 0.12, 0.65, 4, 1, false ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0.5 ], [ Math.PI/2, 0, 0 ] ]
                ]
            };

            this.highlightGizmos = {
                Z: [
                ],
                RX: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.02, 12, 60, 2 * Math.PI ), new GizmoMaterial( { color: 0xff0000, opacity: 1 } ) ), [ 0, 0, 0 ], [ 0, -Math.PI/2, -Math.PI/2 ], false ]
                ],
                RY: [
                    [ new THREE.Mesh( new THREE.TorusGeometry( 1, 0.02, 12, 60, 2 * Math.PI ), new GizmoMaterial( { color: 0x0000ff, opacity: 1 } ) ), [ 0, 0, 0 ], [ Math.PI/2, 0, 0 ], false ]
                ]
            };

            this.hemiPickerGizmos = {
                XYZ: [
                    [ new THREE.Mesh( new THREE.SphereGeometry( 1.2, 8, 8, 0, Math.PI ), new GizmoMaterial( { color: 0x0000ff } ) ), null, null, false ]
                ]
            };

        };

        this.setActivePlane = function ( axis, eye ) {

            if ( this.activeMode == "translate" ) {

                var tempMatrix = new THREE.Matrix4();
                eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

                if ( axis == "X" ) {
                    this.activePlane = this.planes[ "XY" ];
                    if ( Math.abs(eye.y) > Math.abs(eye.z) ) this.activePlane = this.planes[ "XZ" ];
                }

                if ( axis == "Y" ){
                    this.activePlane = this.planes[ "XY" ];
                    if ( Math.abs(eye.x) > Math.abs(eye.z) ) this.activePlane = this.planes[ "YZ" ];
                }

                if ( axis == "Z" ){
                    this.activePlane = this.planes[ "XZ" ];
                    if ( Math.abs(eye.x) > Math.abs(eye.y) ) this.activePlane = this.planes[ "YZ" ];
                }

            } else if ( this.activeMode == "rotate" ){

                if ( axis == "RX" ) this.activePlane = this.planes[ "YZ" ];

                if ( axis == "RY" ) this.activePlane = this.planes[ "XZ" ];

                if ( axis == "RZ" ) this.activePlane = this.planes[ "XY" ];

            }

            this.hide();
            this.show();

        };

        this.update = function ( rotation, eye2 ) {

            if ( this.activeMode == "translate" ) {

                THREE.TransformGizmo.prototype.update.apply( this, arguments );

            } else if ( this.activeMode == "rotate" ) {

                THREE.TransformGizmo.prototype.update.apply( this, arguments );

                var tempMatrix = new THREE.Matrix4();
                var worldRotation = new THREE.Euler( 0, 0, 1 );
                var tempQuaternion = new THREE.Quaternion();
                var unitX = new THREE.Vector3( 1, 0, 0 );
                var unitY = new THREE.Vector3( 0, 1, 0 );
                var unitZ = new THREE.Vector3( 0, 0, 1 );
                var quaternionX = new THREE.Quaternion();
                var quaternionY = new THREE.Quaternion();
                var quaternionZ = new THREE.Quaternion();
                var eye = eye2.clone();

                worldRotation.copy( this.planes["XY"].rotation );
                tempQuaternion.setFromEuler( worldRotation );

                tempMatrix.makeRotationFromQuaternion( tempQuaternion ).getInverse( tempMatrix );
                eye.applyMatrix4( tempMatrix );

                this.traverse(function(child) {

                    tempQuaternion.setFromEuler( worldRotation );

                    if ( child.name == "RX" ) {
                        quaternionX.setFromAxisAngle( unitX, Math.atan2( -eye.y, eye.z ) );
                        tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
                        child.quaternion.copy( tempQuaternion );
                    }

                    if ( child.name == "RY" ) {
                        quaternionY.setFromAxisAngle( unitY, Math.atan2( eye.x, eye.z ) );
                        tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
                        child.quaternion.copy( tempQuaternion );
                    }

                    if ( child.name == "RZ" ) {
                        quaternionZ.setFromAxisAngle( unitZ, Math.atan2( eye.y, eye.x ) );
                        tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );
                        child.quaternion.copy( tempQuaternion );
                    }

                });

            }

        };

        this.show = function () {
            this.traverse(function( child ) {
                if ( scope.parent == null || (scope.parent.useAllPickers || child.parent != scope.handles) ) child.visible = true;
                if ( child.material ) child.material.opacity = child.material.oldOpacity;
                if ( child.parent == scope.pickers || child.parent == scope.hemiPicker || child.parent == scope.subPickers) child.visible = false;
                if ( child.parent == scope.planes || child.parent == scope.highlights ) child.visible = false;
            });
            this.activePlane.visible = false;
        };

        this.highlight = function ( axis ) {
            this.traverse(function( child ) {
                if ( child.material && child.material.highlight ) {
                    if ( child.name == axis ) {
                        if ( child.parent == scope.highlights || child.parent == scope.handles ) child.visible = true;
                        child.material.highlight( true );
                    } else {
                        child.material.highlight( false );
                        child.material.opacity = 0.1;
                    }
                }
            });
        };

        this.init();

    };

    THREE.TransformGizmoTranslateRotate.prototype = Object.create( THREE.TransformGizmo.prototype );

    THREE.TransformGizmoScale = function () {

        THREE.TransformGizmo.call( this );

        this.setHandlePickerGizmos = function () {

            var arrowGeometry = createArrowGeometry( 0.125, 0.125, 0.125 );
            var lineXGeometry = createLineGeometry( 'X' );
            var lineYGeometry = createLineGeometry( 'Y' );
            var lineZGeometry = createLineGeometry( 'Z' );

            this.handleGizmos = {
                X: [
                    [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xff0000 } ) ), [ 0.5, 0, 0 ], [ 0, 0, -Math.PI/2 ] ],
                    [ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
                ],
                Y: [
                    [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x00ff00 } ) ), [ 0, 0.5, 0 ] ],
                    [ new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: 0x00ff00 } ) ) ]
                ],
                Z: [
                    [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 0.5 ], [ Math.PI/2, 0, 0 ] ],
                    [ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
                ],
                XYZ: [
                    [ new THREE.Mesh( new THREE.BoxGeometry( 0.125, 0.125, 0.125 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
                ]
            };

            this.pickerGizmos = {
                X: [
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), new GizmoMaterial( { color: 0xff0000, opacity: 0.25 } ) ), [ 0.6, 0, 0 ], [ 0, 0, -Math.PI/2 ] ]
                ],
                Y: [
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), new GizmoMaterial( { color: 0x00ff00, opacity: 0.25 } ) ), [ 0, 0.6, 0 ] ]
                ],
                Z: [
                    [ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 1, 4, 1, false ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0.6 ], [ Math.PI/2, 0, 0 ] ]
                ],
                XYZ: [
                    [ new THREE.Mesh( new THREE.BoxGeometry( 0.4, 0.4, 0.4 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
                ]
            };

        };

        this.setActivePlane = function ( axis, eye ) {

            var tempMatrix = new THREE.Matrix4();
            eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

            if ( axis == "X" ) {
                this.activePlane = this.planes[ "XY" ];
                if ( Math.abs(eye.y) > Math.abs(eye.z) ) this.activePlane = this.planes[ "XZ" ];
            }

            if ( axis == "Y" ){
                this.activePlane = this.planes[ "XY" ];
                if ( Math.abs(eye.x) > Math.abs(eye.z) ) this.activePlane = this.planes[ "YZ" ];
            }

            if ( axis == "Z" ){
                this.activePlane = this.planes[ "XZ" ];
                if ( Math.abs(eye.x) > Math.abs(eye.y) ) this.activePlane = this.planes[ "YZ" ];
            }

            if ( axis == "XYZ" ) this.activePlane = this.planes[ "XYZE" ];

            this.hide();
            this.show();

        };

        this.init();

    };

    THREE.TransformGizmoScale.prototype = Object.create( THREE.TransformGizmo.prototype );

    THREE.TransformControls = function ( camera, domElement, mode ) {

        // TODO: Make non-uniform scale and rotate play nice in hierarchies
        // TODO: ADD RXYZ contol

        THREE.Object3D.call( this );

        domElement = ( domElement !== undefined ) ? domElement : document;

        this.gizmo = {};
        switch ( mode ) {
            case "translate":
                this.gizmo[mode] = new THREE.TransformGizmoTranslate();
                break;
            case "rotate":           
               this.gizmo[mode] = new THREE.TransformGizmoRotate();
               break;
            case "transrotate":
                this.gizmo[mode] = new THREE.TransformGizmoTranslateRotate();
                break;
            case "scale":
                this.gizmo[mode] = new THREE.TransformGizmoScale();
                break;
        }

        this.add(this.gizmo[mode]);
        this.gizmo[mode].hide();

        this.object = undefined;
        this.snap = null;
        this.snapDelta = 0;
        this.space = "world";
        this.size = 1;
        this.axis = null;
        this.useAllPickers = true;

        this.unitX = new THREE.Vector3( 1, 0, 0 );
        this.unitY = new THREE.Vector3( 0, 1, 0 );
        this.unitZ = new THREE.Vector3( 0, 0, 1 );
        this.normal = new THREE.Vector3(0, 0, 1);

        if ( mode === "transrotate" ) {
            var geometry = new THREE.Geometry();
            geometry.vertices.push( new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1) );
            var material = new THREE.LineBasicMaterial( {color: 0x000000, linewidth:2, depthTest: false} );
            this.startLine = new THREE.Line( geometry, material );
            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial( {color: 0xffe603, linewidth:2, depthTest: false} );
            geometry.vertices.push( new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1) );
            this.endLine = new THREE.Line( geometry, material );
            var geometry = new THREE.Geometry();
            var material = new THREE.LineDashedMaterial({color: 0x000000, linewidth:1, depthTest: false});
            geometry.vertices.push( new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0) );
            this.centerLine = new THREE.Line( geometry, material );

            var map = THREE.ImageUtils.loadTexture(Autodesk.Viewing.Private.getResourceUrl("res/textures/centerMarker_X.png"));
            map.magFilter = map.minFilter = THREE.NearestFilter;
            var geometry = new THREE.CircleGeometry( 0.1, 32 );
            var material = new THREE.MeshBasicMaterial({opacity: 1, side: THREE.DoubleSide, transparent:true, map:map});
            this.centerMark = new THREE.Mesh( geometry, material );
            this.centerMark.rotation.set(Math.PI/2, 0, 0);

            this.ticks = {};
            var map = THREE.ImageUtils.loadTexture(Autodesk.Viewing.Private.getResourceUrl("res/textures/cardinalPoint.png"));
            map.magFilter = map.minFilter = THREE.NearestFilter;
            var material = new THREE.MeshBasicMaterial({depthTest: false, opacity: 1, transparent:true, side: THREE.DoubleSide, map:map});
            var w = 0.12, h = 0.25, d = 1.15;

            this.ticks["RX"] = new THREE.Object3D();
            var geometry = new THREE.PlaneBufferGeometry(w, h);
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 0, -d-h/2);
            mesh.rotation.set(Math.PI/2, Math.PI/2, 0);
            this.ticks["RX"].add(mesh);

            mesh = mesh.clone();
            mesh.position.set(0, d+h/2, 0);
            mesh.rotation.set(0, Math.PI/2, 0);
            this.ticks["RX"].add(mesh);

            mesh = mesh.clone();
            mesh.position.set(0, 0, d+h/2);
            mesh.rotation.set(0, Math.PI/2, Math.PI/2);
            this.ticks["RX"].add(mesh);

            mesh = mesh.clone();
            mesh.position.set(0, -d-h/2, 0);
            mesh.rotation.set(0, Math.PI/2, 0);
            this.ticks["RX"].add(mesh);

            this.ticks["RY"] = new THREE.Object3D();
            mesh = mesh.clone();
            mesh.position.set(0, 0, -d-h/2);
            mesh.rotation.set(Math.PI/2, 0, 0);
            this.ticks["RY"].add(mesh);

            mesh = mesh.clone();
            mesh.position.set(-d-h/2, 0, 0);
            mesh.rotation.set(Math.PI/2, 0, Math.PI/2);
            this.ticks["RY"].add(mesh);

            mesh = mesh.clone();
            mesh.position.set(0, 0, d+h/2);
            mesh.rotation.set(Math.PI/2, 0, 0);
            this.ticks["RY"].add(mesh);

            mesh = mesh.clone();
            mesh.position.set(d+h/2, 0, 0);
            mesh.rotation.set(Math.PI/2, 0, Math.PI/2);
            this.ticks["RY"].add(mesh);
        }

        var scope = this;

        var _dragging = false;
        var _mode = mode;
        var _plane = "XY";

        var changeEvent = { type: "change" };
        var mouseDownEvent = { type: "mouseDown" };
        var mouseUpEvent = { type: "mouseUp", mode: _mode };
        var objectChangeEvent = { type: "objectChange" };

        var ray = new THREE.Raycaster();
        var pointerVector = new THREE.Vector3();
        var pointerDir = new THREE.Vector3();

        var point = new THREE.Vector3();
        var offset = new THREE.Vector3();

        var rotation = new THREE.Vector3();
        var offsetRotation = new THREE.Vector3();
        var scale = 1;

        var lookAtMatrix = new THREE.Matrix4();
        var eye = new THREE.Vector3();

        var tempMatrix = new THREE.Matrix4();
        var tempVector = new THREE.Vector3();
        var tempQuaternion = new THREE.Quaternion();
        var projX = new THREE.Vector3();
        var projY = new THREE.Vector3();
        var projZ = new THREE.Vector3();

        var quaternionXYZ = new THREE.Quaternion();
        var quaternionX = new THREE.Quaternion();
        var quaternionY = new THREE.Quaternion();
        var quaternionZ = new THREE.Quaternion();
        var quaternionE = new THREE.Quaternion();

        var oldPosition = new THREE.Vector3();
        var oldScale = new THREE.Vector3();
        var oldRotationMatrix = new THREE.Matrix4();

        var parentRotationMatrix  = new THREE.Matrix4();
        var parentScale = new THREE.Vector3();

        var worldPosition = new THREE.Vector3();
        var worldRotation = new THREE.Euler();
        var worldRotationMatrix  = new THREE.Matrix4();
        var camPosition = new THREE.Vector3();
        var camRotation = new THREE.Euler();

        this.attach = function ( object ) {

            scope.object = object;

            this.gizmo[_mode].show();

            scope.update();

            scope.updateUnitVectors();

        };

        this.detach = function ( object ) {

            scope.object = undefined;
            this.axis = null;

            this.gizmo[_mode].hide();

        };

        this.setMode = function ( mode ) {

            _mode = mode ? mode : _mode;

            if ( _mode == "scale" ) scope.space = "local";

            this.gizmo[_mode].show();

            this.update();
            scope.dispatchEvent( changeEvent );

        };

        this.getPicker = function () {

            return scope.gizmo[_mode].hemiPicker.children;

        };

        this.setPosition = function ( position ) {

            this.object.position.copy ( position );
            this.update();
        
        };

        this.setNormal = function ( normal ) {

            tempQuaternion.setFromUnitVectors( this.normal, normal );
            this.unitX.applyQuaternion( tempQuaternion );
            this.unitY.applyQuaternion( tempQuaternion );
            this.unitZ.applyQuaternion( tempQuaternion );
            this.normal.copy( normal );
            if (this.object) {
                this.object.quaternion.multiply ( tempQuaternion );
            }
            this.update();
        };

        this.setSnap = function ( snap, delta ) {

            scope.snap = snap;
            scope.snapDelta = delta;

        };

        this.setSize = function ( size ) {

            scope.size = size;
            this.update();
            scope.dispatchEvent( changeEvent );

        };

        this.setSpace = function ( space ) {

            scope.space = space;
            this.update();
            scope.dispatchEvent( changeEvent );

        };

        this.update = function (highlight) {

            if ( scope.object === undefined ) return;

            scope.object.updateMatrixWorld();
            worldPosition.setFromMatrixPosition( scope.object.matrixWorld );
            worldRotation.setFromRotationMatrix( tempMatrix.extractRotation( scope.object.matrixWorld ) );

            camera.updateMatrixWorld();
            camPosition.setFromMatrixPosition( camera.matrixWorld );
            //camRotation.setFromRotationMatrix( tempMatrix.extractRotation( camera.matrixWorld ) );

            this.position.copy( worldPosition );

            this.quaternion.setFromEuler( worldRotation );

            this.normal.set( 0, 0, 1 );
            this.normal.applyEuler( worldRotation );

            // keep same screen height (100px)
            var dist = worldPosition.distanceTo( camPosition );
            var height = camera.isPerspective? 2 * Math.tan( camera.fov * Math.PI / 360 ) * dist : dist;
            var rect = domElement.getBoundingClientRect();
            scale = 100 * height / rect.height;
            this.scale.set( scale, scale, scale );

            //eye.copy( camPosition ).sub( worldPosition ).normalize();

            //if ( scope.space == "local" )
            //    this.gizmo[_mode].update( worldRotation, eye );
            //else if ( scope.space == "world" )
            //    this.gizmo[_mode].update( new THREE.Euler(), eye );

            if (highlight)
                this.gizmo[_mode].highlight( scope.axis );

        };

        this.updateUnitVectors = function () {

            this.unitX.set( 1, 0, 0 );
            this.unitY.set( 0, 1, 0 );
            this.unitZ.set( 0, 0, 1 );
            this.unitX.applyEuler( worldRotation );
            this.unitY.applyEuler( worldRotation );
            this.unitZ.applyEuler( worldRotation );

        };

        this.showRotationGizmos = function (set) {

            var handles = this.gizmo[_mode].handles.children;
            for ( var i = 0; i < handles.length; i++ ) {
                var child = handles[i];
                child.visible = true;
                if ( child.name.search("R") !== -1 ) child.visible = set;
            }
            this.useAllPickers = set;
            
        };

        this.highlight = function () {

            this.gizmo[_mode].highlight( this.axis || "Z" );

        };

        this.onPointerHover = function( event ) {

            if ( scope.object === undefined || _dragging === true ) return false;

            var pointer = event.pointers ? event.pointers[ 0 ] : event;

            var intersect = intersectObjects( pointer, scope.useAllPickers? scope.gizmo[_mode].pickers.children: scope.gizmo[_mode].subPickers.children );

            var axis = null;
            var mode = "";

            if ( intersect ) {

                axis = intersect.object.name;
                mode = axis.search("R") != -1 ? "rotate" : "translate";

            }

            if ( scope.axis !== axis ) {

                scope.axis = axis;
                scope.gizmo[_mode].activeMode = mode;
                scope.update(true);
                scope.dispatchEvent( changeEvent );

            } 

            if (scope.axis === null) {

                scope.gizmo[_mode].show();
            
            }

            return intersect? true : false;

        }

        this.onPointerDown = function( event ) {

            if ( scope.object === undefined || _dragging === true ) return false;
            
            var pointer = event.pointers ? event.pointers[ 0 ] : event;

            if ( event.pointerType === 'touch' ) {

                var intersect = intersectObjects( pointer, scope.useAllPickers? scope.gizmo[_mode].pickers.children: scope.gizmo[_mode].subPickers.children );

                var axis = null;
                var mode = "";

                if ( intersect ) {

                    axis = intersect.object.name;
                    mode = axis.search("R") != -1 ? "rotate" : "translate";

                }

                if ( scope.axis !== axis ) {

                    scope.axis = axis;
                    scope.gizmo[_mode].activeMode = mode;
                }
            }

            var intersect = null;

            if ( pointer.button === 0 || pointer.button === undefined ) {

                intersect = intersectObjects( pointer, scope.useAllPickers? scope.gizmo[_mode].pickers.children: scope.gizmo[_mode].subPickers.children );

                if ( intersect ) {

                    scope.dispatchEvent( mouseDownEvent );

                    scope.axis = intersect.object.name;

                    scope.update();

                    eye.copy( camera.position ).sub( worldPosition ).normalize();

                    scope.gizmo[_mode].setActivePlane( scope.axis, eye );

                    var planeIntersect = intersectObjects( pointer, [scope.gizmo[_mode].activePlane] );

                    if ( planeIntersect )
                        offset.copy( planeIntersect.point );

                    oldPosition.copy( scope.object.position );
                    oldScale.copy( scope.object.scale );

                    oldRotationMatrix.extractRotation( scope.object.matrix );
                    worldRotationMatrix.extractRotation( scope.object.matrixWorld );

                    if ( scope.object.parent ) {
                        parentRotationMatrix.extractRotation( scope.object.parent.matrixWorld );
                        parentScale.setFromMatrixScale( tempMatrix.getInverse( scope.object.parent.matrixWorld ) );
                    } else {
                        parentRotationMatrix.extractRotation( scope.object.matrixWorld );
                        parentScale.setFromMatrixScale( tempMatrix.getInverse( scope.object.matrixWorld ) );
                    }

                    // show rotation start line and ticks
                    if ( _mode === "transrotate" && scope.gizmo[_mode].activeMode === "rotate" ) {
                        scope.startLine.geometry.vertices[0].set(0, 0, 0).applyMatrix4( scope.matrixWorld );
                        scope.startLine.geometry.vertices[1].set(0, 0, 1).applyMatrix4( scope.matrixWorld );
                        scope.startLine.geometry.verticesNeedUpdate = true;
                        scope.parent.add( scope.startLine );

                        var pos = scope.object.geometry.getAttribute('position');
                        var pt1 = new THREE.Vector3().fromAttribute(pos, 0).applyMatrix4( scope.object.matrixWorld );
                        var pt2 = new THREE.Vector3().fromAttribute(pos, 1).applyMatrix4( scope.object.matrixWorld );
                        var pt3 = new THREE.Vector3().fromAttribute(pos, 2).applyMatrix4( scope.object.matrixWorld );
                        var pt4 = new THREE.Vector3().fromAttribute(pos, 3).applyMatrix4( scope.object.matrixWorld );
                        if (scope.axis === "RX") {
                            pt1.lerp(pt3, 0.5);
                            pt2.lerp(pt4, 0.5);
                            var dist = pt1.distanceTo(pt2);
                            scope.centerLine.material.dashSize = dist / 15;
                            scope.centerLine.material.gapSize = dist / 30;
                            scope.centerLine.geometry.vertices[0].copy(pt1);
                            scope.centerLine.geometry.vertices[1].copy(pt2);
                        } else {
                            pt1.lerp(pt2, 0.5);
                            pt3.lerp(pt4, 0.5);
                            var dist = pt1.distanceTo(pt3);
                            scope.centerLine.material.dashSize = dist / 15;
                            scope.centerLine.material.gapSize = dist / 30;
                            scope.centerLine.geometry.vertices[0].copy(pt1);
                            scope.centerLine.geometry.vertices[1].copy(pt3);
                        }
                        scope.centerLine.geometry.computeLineDistances();
                        scope.centerLine.geometry.verticesNeedUpdate = true;
                        scope.parent.add( scope.centerLine );

                        scope.ticks[scope.axis].position.copy( scope.position );
                        scope.ticks[scope.axis].quaternion.copy( scope.quaternion );
                        scope.ticks[scope.axis].scale.copy( scope.scale );
                        scope.parent.add( scope.ticks[scope.axis] );
                    }

                }

            }

            _dragging = true;

            return intersect? true: false;

        }

        this.onPointerMove = function( event ) {

            if ( scope.object === undefined || scope.axis === null || _dragging === false ) return false;

            var pointer = event.pointers ? event.pointers[ 0 ] : event;

            var planeIntersect = intersectObjects( pointer, [scope.gizmo[_mode].activePlane] );

            if ( planeIntersect )
                point.copy( planeIntersect.point );

            var mode = scope.gizmo[_mode].activeMode;
            if ( mode == "translate" ) {

                point.sub( offset );
                point.multiply(parentScale);

                if ( scope.space == "local" ) {

                    point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                    projX.copy( this.unitX );
                    projY.copy( this.unitY );
                    projZ.copy( this.unitZ );
                    tempVector.set( 0, 0, 0 );
                    if ( scope.axis.search("X") != -1 ) {
                        projX.multiplyScalar( point.dot( this.unitX ) );
                        tempVector.add( projX );
                    }
                    if ( scope.axis.search("Y") != -1 ) {
                        projY.multiplyScalar( point.dot( this.unitY ) );
                        tempVector.add(projY);
                    }
                    if ( scope.axis.search("Z") != -1 ) {
                        projZ.multiplyScalar( point.dot( this.unitZ ) );
                        tempVector.add( projZ );
                    }
                    point.copy( tempVector );

                    point.applyMatrix4( oldRotationMatrix );

                    scope.object.position.copy( oldPosition );
                    scope.object.position.add( point );

                }

                if ( scope.space == "world" || scope.axis.search("XYZ") != -1 ) {

                    projX.copy( this.unitX );
                    projY.copy( this.unitY );
                    projZ.copy( this.unitZ );
                    tempVector.set( 0, 0, 0 );
                    if ( scope.axis.search("X") != -1 ) {
                        projX.multiplyScalar( point.dot( this.unitX ) );
                        tempVector.add( projX );
                    }
                    if ( scope.axis.search("Y") != -1 ) {
                        projY.multiplyScalar( point.dot( this.unitY ) );
                        tempVector.add(projY);
                    }
                    if ( scope.axis.search("Z") != -1 ) {
                        projZ.multiplyScalar( point.dot( this.unitZ ) );
                        tempVector.add( projZ );
                    }
                    point.copy( tempVector );

                    point.applyMatrix4( tempMatrix.getInverse( parentRotationMatrix ) );

                    scope.object.position.copy( oldPosition );
                    scope.object.position.add( point );

                }

            } else if ( mode == "scale" ) {

                point.sub( offset );
                point.multiply(parentScale);

                if ( scope.space == "local" ) {

                    if ( scope.axis == "XYZ") {

                        scale = 1 + ( ( point.y ) / 50 );

                        scope.object.scale.x = oldScale.x * scale;
                        scope.object.scale.y = oldScale.y * scale;
                        scope.object.scale.z = oldScale.z * scale;

                    } else {

                        point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                        if ( scope.axis == "X" ) scope.object.scale.x = oldScale.x * ( 1 + point.x / 50 );
                        if ( scope.axis == "Y" ) scope.object.scale.y = oldScale.y * ( 1 + point.y / 50 );
                        if ( scope.axis == "Z" ) scope.object.scale.z = oldScale.z * ( 1 + point.z / 50 );

                    }

                }

            } else if ( mode == "rotate") {

                point.sub( worldPosition );
                point.multiply(parentScale);
                tempVector.copy(offset).sub( worldPosition );
                tempVector.multiply(parentScale);

                if ( scope.axis == "RE" ) {

                    point.applyMatrix4( tempMatrix.getInverse( lookAtMatrix ) );
                    tempVector.applyMatrix4( tempMatrix.getInverse( lookAtMatrix ) );

                    rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
                    offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

                    tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

                    var rotz = rotation.z - offsetRotation.z;
                    if ( scope.snap !== null ) {
                        var rotsnap = Math.round( rotz / scope.snap ) * scope.snap;
                        if ( Math.abs(rotsnap-rotz) < scope.snapDelta ) {
                            rotz = rotsnap;
                        }
                    }
                    quaternionE.setFromAxisAngle( eye, rotz );
                    quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionE );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

                    scope.object.quaternion.copy( tempQuaternion );

                } else if ( scope.axis == "RXYZE" ) {

                    var tempAxis = point.clone().cross(tempVector).normalize(); // rotation axis

                    tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

                    var rot = - point.clone().angleTo(tempVector);
                    if ( scope.snap !== null ) {
                        var rotsnap = Math.round( rot / scope.snap ) * scope.snap;
                        if ( Math.abs(rotsnap-rot) < scope.snapDelta ) {
                            rot = rotsnap;
                        }
                    }
                    quaternionX.setFromAxisAngle( tempAxis, rot );
                    quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

                    scope.object.quaternion.copy( tempQuaternion );

                } else if ( scope.space == "local" ) {

                    point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                    tempVector.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                    var projx = point.dot(this.unitX), projy = point.dot(this.unitY), projz = point.dot(this.unitZ);
                    var tempx = tempVector.dot(this.unitX), tempy = tempVector.dot(this.unitY), tempz = tempVector.dot(this.unitZ);
                    rotation.set( Math.atan2( projz, projy ), Math.atan2( projx, projz ), Math.atan2( projy, projx ) );
                    offsetRotation.set( Math.atan2( tempz, tempy ), Math.atan2( tempx, tempz ), Math.atan2( tempy, tempx ) );

                    var rotx = rotation.x - offsetRotation.x;
                    var roty = rotation.y - offsetRotation.y;
                    var rotz = rotation.z - offsetRotation.z;
                    if ( scope.snap !== null ) {
                        if ( scope.axis.search("X") != -1 ) {
                            var rotsnap = Math.round( rotx / scope.snap ) * scope.snap;
                            if ( Math.abs(rotsnap-rotx) < scope.snapDelta ) {
                                rotx = rotsnap;
                            }
                        }
                        if ( scope.axis.search("Y") != -1 ) {
                            var rotsnap = Math.round( roty / scope.snap ) * scope.snap;
                            if ( Math.abs(rotsnap-roty) < scope.snapDelta ) {
                                roty = rotsnap;
                            }
                        }
                        if ( scope.axis.search("Z") != -1 ) {
                            var rotsnap = Math.round( rotz / scope.snap ) * scope.snap;
                            if ( Math.abs(rotsnap-rotz) < scope.snapDelta ) {
                                rotz = rotsnap;
                            }
                        }
                    }
                    quaternionX.setFromAxisAngle( this.unitX, rotx );
                    quaternionY.setFromAxisAngle( this.unitY, roty );
                    quaternionZ.setFromAxisAngle( this.unitZ, rotz );
                    quaternionXYZ.setFromRotationMatrix( oldRotationMatrix );

                    if ( scope.axis == "RX" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionX );
                    if ( scope.axis == "RY" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionY );
                    if ( scope.axis == "RZ" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionZ );

                    scope.object.quaternion.copy( quaternionXYZ );

                } else if ( scope.space == "world" ) {

                    var projx = point.dot(this.unitX), projy = point.dot(this.unitY), projz = point.dot(this.unitZ);
                    var tempx = tempVector.dot(this.unitX), tempy = tempVector.dot(this.unitY), tempz = tempVector.dot(this.unitZ);
                    rotation.set( Math.atan2( projz, projy ), Math.atan2( projx, projz ), Math.atan2( projy, projx ) );
                    offsetRotation.set( Math.atan2( tempz, tempy ), Math.atan2( tempx, tempz ), Math.atan2( tempy, tempx ) );

                    tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

                    var rotx = rotation.x - offsetRotation.x;
                    var roty = rotation.y - offsetRotation.y;
                    var rotz = rotation.z - offsetRotation.z;
                    if ( scope.snap !== null ) {
                        if ( scope.axis.search("X") != -1 ) {
                            var rotsnap = Math.round( rotx / scope.snap ) * scope.snap;
                            if ( Math.abs(rotsnap-rotx) < scope.snapDelta ) {
                                rotx = rotsnap;
                            }
                        }
                        if ( scope.axis.search("Y") != -1 ) {
                            var rotsnap = Math.round( roty / scope.snap ) * scope.snap;
                            if ( Math.abs(rotsnap-roty) < scope.snapDelta ) {
                                roty = rotsnap;
                            }
                        }
                        if ( scope.axis.search("Z") != -1 ) {
                            var rotsnap = Math.round( rotz / scope.snap ) * scope.snap;
                            if ( Math.abs(rotsnap-rotz) < scope.snapDelta ) {
                                rotz = rotsnap;
                            }
                        }
                    }
                    quaternionX.setFromAxisAngle( this.unitX, rotx );
                    quaternionY.setFromAxisAngle( this.unitY, roty );
                    quaternionZ.setFromAxisAngle( this.unitZ, rotz );
                    quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

                    if ( scope.axis == "RX" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
                    if ( scope.axis == "RY" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
                    if ( scope.axis == "RZ" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );

                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

                    scope.object.quaternion.copy( tempQuaternion );

                }

                // show rotation end line
                if (_mode === "transrotate" ) {
                    scope.add( scope.endLine );
                    scope.add( scope.centerMark );
                }

            }

            // update matrix
            scope.object.matrixAutoUpdate = true;

            scope.update(true);
            scope.dispatchEvent( changeEvent );
            scope.dispatchEvent( objectChangeEvent );

            return planeIntersect? true : false;

        }

        this.onPointerUp = function( event ) {

            if ( _dragging && ( scope.axis !== null ) ) {
                mouseUpEvent.mode = _mode;
                scope.dispatchEvent( mouseUpEvent )
            }
            _dragging = false;

            this.gizmo[_mode].show();

            this.updateUnitVectors();

            // remove rotation start/end lines
            if ( _mode === "transrotate" && this.gizmo[_mode].activeMode === "rotate" ) {
                this.remove( this.endLine );
                this.remove( this.centerMark );
                this.parent.remove( this.centerLine );
                this.parent.remove( this.startLine );
                this.parent.remove( this.ticks[this.axis] );
            }

            return false;

        }

        function intersectObjects( pointer, objects ) {

            var rect = domElement.getBoundingClientRect();
            var x = ( ( pointer.clientX - rect.left ) / rect.width ) * 2 - 1;
            var y = - ( ( pointer.clientY - rect.top ) / rect.height ) * 2 + 1;
          
            if ( camera.isPerspective ) {
                pointerVector.set( x, y, 0.5 );
                pointerVector.unproject( camera );
                ray.set( camera.position, pointerVector.sub( camera.position ).normalize() );
            } else {
                pointerVector.set( x, y, -1 );
                pointerVector.unproject( camera );
                pointerDir.set( 0, 0, -1 );
                ray.set( pointerVector, pointerDir.transformDirection( camera.matrixWorld ) );
            }

            var intersections = ray.intersectObjects( objects, true );
            return intersections[0] ? intersections[0] : false;

        }

    };

    THREE.TransformControls.prototype = Object.create( THREE.Object3D.prototype );

};

//# sourceMappingURL=nanocore.js.map
