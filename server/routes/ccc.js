/**
 * CCC compute routes
 */
const assert = require('assert');
const express = require('express');
const config = require('../main/config');

const router = new express.Router();

/**
 * Runs a turbo CCC job (no saving)
 * See CCC.prototype.runTurbo for more complete descriptions of
 * parameters and results.
 */
router.post('/run/turbo', (req, res, next) => {
  config.ccc.runTurbo(req.body)
    .then(result => res.json(result))
    .catch(next);
});

router.post('/run/:sessionId/:widgetId', (req, res, next) => {
  const sessionId = req.params.sessionId;
  const widgetId = req.params.widgetId;

  // Massage mst input type to CCC input type
  req.body.inputs = Object.keys(req.body.inputs).map((inputName) => {
    return {
      name: inputName,
      type: req.body.inputs[inputName].type,
      value: req.body.inputs[inputName].value
    };
  });

  if (req.body.command) {
    req.body.cmd = req.body.command;
  }

  config.ccc.run(sessionId, widgetId, req.body)
    .then((result) => {
      assert(result.jobId);
      res.json({ sessionId, jobId: result.jobId });
    })
    .catch(next);
});

router.post('/cwl/:sessionId/:widgetId', (req, res, next) => {
  const sessionId = req.params.sessionId;
  const widgetId = req.params.widgetId;

  config.ccc.cwl(sessionId, widgetId, req.body)
    .then((result) => {
      assert(result.jobId);
      res.json({ sessionId, jobId: result.jobId });
    })
    .catch(next);
});

module.exports = router;
