import 'reflect-metadata';
import kernel from '../inversify.config';
import {expect} from 'chai';
import {} from 'mocha';
import {ExecutionGraphResolver} from "../interfaces/execution-graph-resolver";

describe('Testing Spawn Creation/Force Error', () => {
  it('should be created by kernel', (done) => {
    const executionGraphResolver = kernel.get<ExecutionGraphResolver>('ExecutionGraphResolver');
    expect(executionGraphResolver).to.exist;
    done();
  });
  it('should have final callback with error', (done) => {
    const executionGraphResolver = kernel.get<ExecutionGraphResolver>('ExecutionGraphResolver');
    executionGraphResolver.forceError = true;
    done();
  });
});

