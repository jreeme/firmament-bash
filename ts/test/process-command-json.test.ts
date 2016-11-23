import 'reflect-metadata';
import kernel from '../inversify.config';
import {expect} from 'chai';
import path = require('path');
import {ProcessCommandJson} from '../interfaces/process-command-json';
describe('Process bash commands from JSON file', function () {
  let processCommandJson: ProcessCommandJson;
  beforeEach(done => {
    processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');
    done();
  });
  afterEach(done => {
    processCommandJson = null;
    done();
  });
  describe('processCommandJson (force error)', () => {
    it('should report error', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.forceError = true;
      processCommandJson.process('How Now', (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.not.equal(null);
        done();
      });
    });
  });
  describe(`processCommandJson (with 'null' Uri)`, () => {
    it('should report error', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.process(null, (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.not.equal(null);
        done();
      });
    });
  });
});

