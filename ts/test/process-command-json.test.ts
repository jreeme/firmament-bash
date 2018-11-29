import 'reflect-metadata';
import kernel from '../inversify.config';
import {expect} from 'chai';
import {ProcessCommandJson} from '../interfaces/process-command-json';
import * as mocha from 'mocha';

describe('Testing Spawn Creation/Force Error', () => {
  mocha.it('use mocha instance to avoid linter warning', (done) => {
    done();
  });
  it('should be created by kernel', (done) => {
    const processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');
    expect(processCommandJson).to.exist;
    done();
  });
  it('should have final callback with error', (done) => {
    const processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');
    processCommandJson.forceError = true;
    done();
  });
});

