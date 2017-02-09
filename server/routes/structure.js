const Busboy = require('busboy');
const Promise = require('bluebird');
const express = require('express');
const fs = Promise.promisifyAll(require('fs'));
const workflowUtils = require('../utils/workflow_utils');

const router = new express.Router();

/**
 * https://docs.google.com/presentation/d/1qP-8fPpsgtJnZOlg96ySwPACZvGlxT1jIIgjBECoDAE/edit#slide=id.g1c36f8ea4a_0_0
 * Expects:
 * {
 *    "inputs": [
 *       {
 *         "name": 'input.json',
 *         "type": "[inline|url]",
 *         "value": JSON.stringify({"input": "C"})
 *       }
 *     ]
 * }
 * @return {"success": true, "outputs": {"filename":"url"}, "jobResult": <CCC Job for debugging>}
 */
router.post('/executeWorkflow0Step0', (req, res, next) => {
  var inputs = req.body.inputs;
  if (!inputs) {
    return next(new Error('No inputs'));
  }

  workflowUtils.executeWorkflow0Step0(inputs)
    .then(jobResult => {
        res.send(jobResult);
    })
    .error(err => {
      log.error(err);
      next(err);
    });
});

/**
 * First step in workflow1: selecting a ligand.
 * https://docs.google.com/presentation/d/1qP-8fPpsgtJnZOlg96ySwPACZvGlxT1jIIgjBECoDAE/edit#slide=id.g1c36f8ea4a_0_0
 * Expects an array with input definitions:
 * {
 *    "inputs": [
 *       {
 *         "name": 'input.json',
 *         "type": "[inline|url]",
 *         "value": JSON.stringify({"input": "C"})
 *       }
 *     ]
 * }
 * @return {"success": true, "outputs": {"filename":"url"}, "jobResult": <CCC Job for debugging>}
 */
router.post('/executeWorkflow1Step0', (req, res, next) => {
  var inputs = req.body.inputs;
  if (!inputs) {
    return next(new Error('No inputs'));
  }

  workflowUtils.executeWorkflow1Step0(inputs)
    .then(jobResult => {
        res.send(jobResult);
    })
    .error(err => {
      log.error(err);
      next(err);
    });
});

module.exports = router;
