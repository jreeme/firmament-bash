import 'reflect-metadata';
import kernel from '../inversify.config';
import {expect} from 'chai';
import path = require('path');
import {ProcessCommandJson} from '../interfaces/process-command-json';
import {ExecutionGraph} from "../interfaces/execution-graph";
const jsonfile = require('jsonfile');
const relativePathToTestJson = 'command-json/valid.json';
const httpUrlToTestJson = 'https://raw.githubusercontent.com/jreeme/firmament-bash/master/command-json/valid.json';
const pathToTestJson = path.resolve(__dirname, '../..', relativePathToTestJson);

describe('Process bash commands from JSON file', function () {
  let processCommandJson: ProcessCommandJson;
  let execGraph: ExecutionGraph;
  beforeEach(done => {
    processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');
    execGraph = jsonfile.readFileSync(pathToTestJson);
    done();
  });
  afterEach(done => {
    processCommandJson = null;
    execGraph = null;
    done();
  });
/*  describe('processCommandJson (force error)', () => {
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
        expect(err.message).to.equal('Invalid parameter');
        done();
      });
    });
  });
  describe(`processCommandJson (with ExecutionGraph as JSON)`, () => {
    it('should process graph successfully', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.process(JSON.stringify(execGraph), (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.equal(null);
        done();
      });
    });
  });*/
  describe(`processCommandJson (with absolute path to invalid JSON file)`, () => {
    it('should process graph successfully', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.process(pathToTestJson + 'bad', (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.not.equal(null);
        expect(err.message).to.contain(`doesn't exist`);
        done();
      });
    });
  });
  describe(`processCommandJson (with cwd relative path to invalid JSON file)`, () => {
    it('should process graph successfully', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.process(relativePathToTestJson + 'bad', (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.not.equal(null);
        expect(err.message).to.contain(`doesn't exist`);
        done();
      });
    });
  });
  describe(`processCommandJson (with http(s):// path to invalid JSON stream)`, () => {
    it('should process graph successfully', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.process(httpUrlToTestJson + 'bad', (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.not.equal(null);
        expect(err.message).to.equal('URI not found');
        done();
      });
    });
  });
  describe(`processCommandJson (with absolute path to valid JSON file)`, () => {
    it('should process graph successfully', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.process(pathToTestJson, (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.equal(null);
        done();
      });
    });
  });
  describe(`processCommandJson (with cwd relative path to valid JSON file)`, () => {
    it('should process graph successfully', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.process(relativePathToTestJson, (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.equal(null);
        done();
      });
    });
  });
  describe(`processCommandJson (with http(s):// path to valid JSON stream)`, () => {
    it('should process graph successfully', done => {
      expect(processCommandJson).to.not.equal(null);
      processCommandJson.process(httpUrlToTestJson, (err, result) => {
        expect(result).to.equal(null);
        expect(err).to.equal(null);
        done();
      });
    });
  });
});

