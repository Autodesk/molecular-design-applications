/**
 * workflow routes
 */
const Path = require('path');
const Fs = require('fs-extended');
const express = require('express');
const Busboy = require('busboy');
const ShortId = require('shortid');
const Promise = require('bluebird');
const Hash = require('object-hash');
const Docker = require('dockerode');

const router = new express.Router();

/* workflow server remote address */
var WORKFLOW_SERVER_ADDRESS = process.env.WORKFLOW_SERVER_ADDRESS || 'localhost:9000';

const WORKFLOW_TEMP_FOLDER = '/tmp/workflow_downloads/';
const WORKFLOW_WORK_FOLDER = '/tmp/workflows/';
const INPUTS = 'inputs';
const OUTPUTS = 'outputs';

/* Redis constants */
const REDIS_WORKFLOW_EMAIL_SET = 'workflow_emails'; // redis<SET>
const REDIS_WORKFLOW_STATUS = 'workflow_status'; // redis<HASH>
const REDIS_WORKFLOW_ERRORS = 'workflow_errors'; // redis<HASH>

/* Values for posting workflows */
const FORM_FIELD_EMAIL = 'email';

/* Docker image vars*/
const INPUT_FILE_NAME = 'input.json';
const OUTPUT_FILE_NAME = 'output.json';
const WORKFLOW_DOCKER_IMAGE = 'docker.io/busybox:latest';
const WORKFLOW_KEY = 'workflowId';

const WORKFLOW_STATE = {
  running: 'running',
  finished: 'finished',
  failed: 'failed',
  none: 'none',
};

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

Fs.ensureDirSync(WORKFLOW_TEMP_FOLDER);
Fs.ensureDirSync(WORKFLOW_WORK_FOLDER);

Redis = require('promise-redis')((resolver) => {
  return new Promise(resolver);
});
var redis = Redis.createClient({host:'redis', port:6379});

router.get('/stdout/:workflowId', (req, res, next) => {
  var workflowId = req.params.workflowId;
  res.sendFile(getWorkflowStdoutPath(workflowId));
});


router.get('/stderr/:workflowId', (req, res, next) => {
  var workflowId = req.params.workflowId;
  res.sendFile(getWorkflowStderrPath(workflowId));
});

router.get('/exitcode/:workflowId', (req, res, next) => {
  var workflowId = req.params.workflowId;
  res.sendFile(getWorkflowExitCodePath(workflowId));
});

router.get('/:workflowId', (req, res, next) => {
  var workflowId = req.params.workflowId;
  if (workflowId == null) {
    res.status(400).send({error:'No workflow id provided'});
  } else {
    try {
      Fs.access(getWorkflowExitCodePath(workflowId));
      var outputPath = Path.join(getWorkflowOutputsPath(workflowId), OUTPUT_FILE_NAME);
      res.sendFile(outputPath);
    } catch(err) {
      getWorkflowState(workflowId)
        .then((state) => {
          if (state == WORKFLOW_STATE.finished) {
            // Return the final data
            var outputPath = Path.join(getWorkflowOutputsPath(workflowId), OUTPUT_FILE_NAME);
            res.sendFile(outputPath);
          } else if (state == WORKFLOW_STATE.failed) {
            redis.hget(REDIS_WORKFLOW_ERRORS, workflowId)
              .then((storedError) => {
                res.status(500).send({state:state, error:storedError});
              }, (err) => {
                res.status(500).send({error:err});
              });
          } else {
            res.status(400).send({state:state});
          }
        }, (err) => {
          res.status(500).send({error:err});
        });
    }
  }
});

/**
 * This route can be polled
 */
router.get('/state/:workflowId', function (req, res) {
  var workflowId = req.params.workflowId;
  if (workflowId == null) {
    res.status(400).send({error:'No workflow id provided'});
  } else {
    try {
      Fs.access(getWorkflowExitCodePath(workflowId));
      res.send({workflowId:workflowId, state:WORKFLOW_STATE.finished});
    } catch(err) {
    }
    getWorkflowState(workflowId)
      .then((state) => {
        getDockerContainer(workflowId)
          .then((container) => {
            res.send({workflowId:workflowId, state:state, container:container});
          }, (err) => {
            res.send({workflowId:workflowId, state:state, error:err});
          });
      }, (err) => {
        res.status(500).send({error:err});
      });
  }
});

router.post('/run', function (req, res) {
  var busboy = new Busboy({ headers: req.headers, limits:{fieldNameSize:500, fieldSize:10737418240}});
  var uuid = ShortId.generate();
  var dataDir = `/tmp/workflow_downloads/${uuid}/`;
  Fs.ensureDirSync(dataDir);
  var cleanup = function() {
    Fs.deleteDirSync(dataDir);
  }

  /*
    busboy doesn't wait until piped file streams emit a close event,
    and this means that the data isn't actually written before the
    busboy.finish event is fired, so any reading of written files
    will fail. By using promises we can listen to the 'close' event
    ensuring that reading those files will work.
   */
  var promises = [];
  var email = null;
  var error = null;
  var isInput = false;

  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    // console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
    if (fieldname != INPUT_FILE_NAME) {
      console.error('Unrecognized File name [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
      // Drain the data
      file.resume();
    } else {
      isInput = true;
      promises.push(new Promise((resolve, reject) => {
        var writeStream = Fs.createWriteStream(Path.join(dataDir, INPUT_FILE_NAME));
        writeStream.on('finish', () => {
          resolve();
        });
        file.on('error', (err) => {
          reject(err);
        });
        file.pipe(writeStream);
      }));
    }
  });
  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    if (fieldname == FORM_FIELD_EMAIL) {
      email = val;
    } else if (fieldname == INPUT_FILE_NAME) {
      isInput = true;
      Fs.writeFileSync(Path.join(dataDir, INPUT_FILE_NAME), val);
    } else {
      console.log(`Unrecognized form field ${fieldname}=${val}`);
    }
  });
  busboy.on('finish', function() {
    Promise.all(promises)
      .then(() => {
        if (email && isInput && !error) {
          console.log('FINISHED PIPING');
          var md5 = getWorkflowInputMd5(dataDir);
          var workflowId = md5;
          console.log('FINISHED PIPING md5=', md5);
          var workFolder = Path.join(WORKFLOW_WORK_FOLDER, workflowId);
          Fs.deleteDirSync(workFolder);
          var inputsPath = getWorkflowInputsPath(workflowId);
          Fs.ensureDirSync(workFolder);
          // Fs.copyDirSync(dataDir, inputsPath);
          Fs.renameSync(dataDir, inputsPath);
          // Add the email to the set of emails to notify
          // when this workflow is complete
          redis.sadd(REDIS_WORKFLOW_EMAIL_SET, email)
            .then((result) => {
              console.log('Redis result', result);
              return setWorkflowState(workflowId, WORKFLOW_STATE.running);
            })
            .then((result) => {
              console.log('After setting state', result);
              executeWorkflow(workflowId);
              res.send({workflowId:workflowId});
            }, (err) => {
              res.status(500).send({error:err});
              cleanup();
            });
        } else {
          if (error) {
            res.status(500).send({error:error});
          } else {
            var errors = [];
            if (!email) {
              errors.push('Missing email field');
            }
            if (!isInput) {
              errors.push('Missing ' + INPUT_FILE_NAME);
            }
            res.status(400).send({errors:errors});
          }
          cleanup();
        }
      }, (err) => {
        console.error(err);
        res.status(500).send({error:err});
        cleanup();
      });
  });

  busboy.on('error', (err) => {
    console.error(err);
  });
  req.pipe(busboy);
});

/**
 * Hashes all files in a directory. If the files
 * are JSON, these will be hashed in a way where
 * semantically equivalent JSON objects will give
 * the same hash value.
 * This can be made async if needed.
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
function getWorkflowInputMd5(path) // String
{
  var files = Fs.listFilesSync(path, {recursive:true});
  files.sort();
  var hashes = [];
  files.forEach(function(e) {
    var filePath = Path.join(path, e);
    if (e.endsWith('.json')) {
      var data = Fs.readFileSync(filePath, {encoding:'utf8'});
      try {
        var jsobObj = JSON.parse(data);
        hashes.push(Hash(jsobObj));
      } catch(err) {
        console.error(err);
        hashes.push(Hash(data));
      }
    } else {
      var data = Fs.readFileSync(filePath);
      hashes.push(Hash(data));
    }
  });
  return Hash(hashes);
}

/**
 * [executeWorkflow description]
 * @param  {[type]} workflowDir [description]
 * @return {[type]}             [description]
 */
function executeWorkflow(workflowId) // Promise<Bool>
{
  console.log(`executeWorkflow ${workflowId}`);
  getDockerImage(WORKFLOW_DOCKER_IMAGE)
    .then((result) => {
      console.log('got image');
      return new Promise((resolve, reject) => {
        var workflowDir = getWorkflowPath(workflowId);
        console.log('executeWorkflow workflowId=' + workflowId);

        var create_options = {Image:WORKFLOW_DOCKER_IMAGE, WorkingDir:'/outputs', Tty:false};
        create_options['Labels'] = {};
        create_options['Labels'][WORKFLOW_KEY] = workflowId;
        create_options['Cmd'] = ['/bin/sh', '-c', `cp /inputs/${INPUT_FILE_NAME} /outputs/${OUTPUT_FILE_NAME}`];
        create_options.HostConfig = {Binds:[
          getWorkflowOutputsPath(workflowId) + ':/' + OUTPUTS + ':rw',
          getWorkflowInputsPath(workflowId) + ':/' + INPUTS + ':rw'
        ]};


        docker.createContainer(create_options, (createContainerError, container) => {
          console.log(`workflow=${workflowId} created container`);
          if (createContainerError != null) {
            console.error({log:'error_creating_container', opts:create_options, error:createContainerError});
            reject({dockerCreateContainerOpts:create_options, error:createContainerError});
            return;
          }

          container.start((containerStartError, data) => {
            console.log(`workflow=${workflowId} started container`);
            if (containerStartError != null) {
              var result = {container:container, error:containerStartError};
              console.error(result);
              reject(result);
              return;
            }
            processContainerEnd(workflowId);
            // container.wait((waitError, endResult) => {
            //   var result = {container:container, error:waitError, result :endResult};
            //   resolve(result);
            // });
          });
        });
    });
  })
  .then((result) => {
    console.log('Finished docker container ')
  }, (err) => {
    console.error(err);
    setWorkflowState(workflowId, WORKFLOW_STATE.failed);
    redis.hset(REDIS_WORKFLOW_ERRORS, workflowId, JSON.stringify(err));
    Fs.deleteDirSync(getWorkflowPath(workflowId));
  });
}

function getWorkflowPath(workflowId)
{
  return Path.join(WORKFLOW_WORK_FOLDER, workflowId);
}

function getWorkflowInputsPath(workflowId)
{
  return Path.join(getWorkflowPath(workflowId), INPUTS);
}

function getWorkflowOutputsPath(workflowId)
{
  return Path.join(getWorkflowPath(workflowId), OUTPUTS);
}

function getWorkflowStdoutPath(workflowId)
{
  return Path.join(getWorkflowPath(workflowId), 'stdout');
}

function getWorkflowStderrPath(workflowId)
{
  return Path.join(getWorkflowPath(workflowId), 'stderr');
}

function getWorkflowExitCodePath(workflowId)
{
  return Path.join(getWorkflowPath(workflowId), 'exitCode');
}

function setWorkflowState(workflowId, state)
{
  return new Promise((resolve, reject) => {
    if (!WORKFLOW_STATE[state]) {
      reject('Unknown workflow state=' + state);
    } else {
      resolve(redis.hset(REDIS_WORKFLOW_STATUS, workflowId, state));
    }
  });
}

function getWorkflowState(workflowId) // Promise
{
  return redis.hget(REDIS_WORKFLOW_STATUS, workflowId)
    .then(function(state) {
      if (state == null) {
        state = WORKFLOW_STATE.none;
      }
      return state;
    });
}

function getDockerImage(dockerImage) // Promise
{
  return new Promise((resolve, reject) => {
    docker.pull(dockerImage, (err, stream) => {
      if (err) {
        reject(err);
      } else {
        function onFinished(finishedErr, output) { // output is an array with output json parsed objects 
          if (finishedErr) {
            reject(finishedErr);
          } else {
            console.log(output);
            resolve(true);
          }
        }
        function onProgress(event) {
        }
        docker.modem.followProgress(stream, onFinished, onProgress);
      }
    });
  });
}

function processContainerEnd(workflowId) {
  var exitcodePath = getWorkflowExitCodePath(workflowId);
  getDockerContainer(workflowId)
    .then((containerData) => {
      var container = docker.getContainer(containerData.Id);
      container.wait((err, result) => {
        console.log(`workflow=${workflowId} in container=${containerData.Id} finished with exitCode=${result.StatusCode}`);
        Fs.writeFileSync(exitcodePath, result.StatusCode);

        writeContainerLogs(workflowId, container, true)
          .then(() => {
            return writeContainerLogs(workflowId, container, false);
          })
          .then(() => {
            // Finally set the state
            setWorkflowState(workflowId, result.StatusCode == 0 ? WORKFLOW_STATE.finished : WORKFLOW_STATE.failed);
            // Then remove the container
            container.remove({force:1}, (err) => {
              if (err) {
                console.error(`Workflow=${workflowId} Error removing container=${containerData.Id} err]${err}`);
              }
            });
            sendEmailsWorkflowEnded(workflowId);
          });
      });
    });
}

function writeContainerLogs(workflowId, container, isStdOut) { // Promise
  var path = isStdOut ? getWorkflowStdoutPath(workflowId) : getWorkflowStderrPath(workflowId);
  var opts = {
    stdout: isStdOut ? 0 : 1,
    stderr: !isStdOut ? 0 : 1
  }
  return new Promise((resolve, reject) => {
    container.logs(opts, (err, logstream) => {
      if (err) {
        reject(err);
      } else {
        if (logstream != null) {
          var logs = '';
          logstream.on('end', () => {
            Fs.writeFileSync(path, logs);
            resolve();
          });
          logstream.on('data', (data) => {
            logs += logs + data;
          });
        } else {
          Fs.writeFileSync(path, '');
          resolve();
        }
      }
    });
  });
}

function getDockerContainer(workflowId) // Promise
{
  var labelKey = `${WORKFLOW_KEY}=${workflowId}`;
  var labelFilter = JSON.stringify({label:[labelKey]});

  return new Promise((resolve, reject) => {
    docker.listContainers({all:true, filters:labelFilter}, (err, containers) => {
      if (err) {
        reject(err);
      } else {
        if (containers.length > 0) {
          resolve(containers[0]);
        } else {
          resolve(null);
        }
      }
    });
  });
}

function sendEmailsWorkflowEnded(workflowId)
{

}

// In case of crashes, check all running workflows and attach listeners to the
// running containers
function reattachExistingWorkflowContainers()
{
  redis.hkeys(REDIS_WORKFLOW_STATUS)
    .then((keys) => {
      keys.forEach((workflowId) => {
        getWorkflowState(workflowId)
          .then((state) => {
            if (state == WORKFLOW_STATE.running) {
              console.log(`workflowId=${workflowId} running, reattaching listener to container`);
              processContainerEnd(workflowId);
            }
          }, (err) => {
            console.log(err);
          });
      });
    }, (err) => {
      console.error(err);
    });
};
reattachExistingWorkflowContainers();

module.exports = router
