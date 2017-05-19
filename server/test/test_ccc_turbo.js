const assert = require('assert');
const request = require('request-promise');
const log = require('../utils/log');

const utils = {

  runTestCCCTurbo() {
    const randomValue1 = Math.random();
    const randomValue2 = Math.random();
    const value1Name = 'val1';
    const value2Name = 'val2';

    function runTurboJob() {
      const scriptName = 'script.sh';
      const script = `
#!/bin/sh
mkdir -p /$OUTPUTS
echo "${randomValue1}" > /outputs/${value1Name}
cp /inputs/${value2Name} /outputs/${value2Name}
`;
      const inputs = {};
      inputs[scriptName] = { value: script };
      inputs[value2Name] = { value: randomValue2 };

      const turboJobParams = {
        image: 'docker.io/busybox:latest',
        command: ['/bin/sh', `/inputs/${scriptName}`],
        inputs,
        parameters: {
          maxDuration: 600,
          cpus: 1
        },
        inputsPath: '/inputs',
        outputsPath: '/outputs'
      };

      const options = {
        method: 'post',
        body: turboJobParams,
        json: true,
        url: `http://localhost:${process.env.PORT}/v1/ccc/run/turbo`
      };

      return request(options)
        .then((body) => {
          if (body.exitCode !== 0) {
            log.warn(`Result: ${JSON.stringify(body)}`);
            return { success: false, error: body.error, exitCode: body.exitCode };
          } else if (body.error) {
            log.warn(`Result: ${JSON.stringify(body)}`);
            return { success: false, error: body.error };
          } else {
            assert(body.outputs[value1Name].trim() === `${randomValue1}`);
            assert(body.outputs[value2Name].trim() === `${randomValue2}`);
            assert(body.error === null);
            assert(body.exitCode === 0);

            return { success: true };
          }
        });
    }

    return runTurboJob()
      .catch((err) => {
        return { success: false, error: JSON.stringify(err).substr(0, 500) };
      });
  }
};

module.exports = utils;
