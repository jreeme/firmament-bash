import 'reflect-metadata';
import kernel from '../inversify.config';
import {expect} from 'chai';
import {} from 'mocha';
import {ExecutionGraphResolver} from "../interfaces/execution-graph-resolver";
import path = require('path');

describe('Testing ExecutionGraphResolver Creation/Force Error', () => {
  let executionGraphResolver:ExecutionGraphResolver;
  beforeEach(()=>{
    executionGraphResolver = kernel.get<ExecutionGraphResolver>('ExecutionGraphResolver');
  });
  afterEach(()=>{
    executionGraphResolver.forceError = false;
  });
  it('should be created by kernel', (done) => {
    expect(executionGraphResolver).to.exist;
    done();
  });
  it('should have callback with error', (done) => {
    executionGraphResolver.forceError = true;
    executionGraphResolver.getFullResourcePath(null, null,(err,fullResourcePath)=>{
      expect(err).to.exist;
      expect(err.message).to.equal('force error: ExecutionGraphResolverImpl.getFullResourcePath');
      expect(fullResourcePath).to.not.exist;
      executionGraphResolver.resolveExecutionGraphFromCatalogEntry(null,(err,executionGraph)=>{
        expect(err).to.exist;
        expect(err.message).to.equal('force error: ExecutionGraphResolverImpl.resolveExecutionGraphFromCatalogEntry');
        expect(executionGraph).to.not.exist;
        executionGraphResolver.resolveExecutionGraph(null,(err,executionGraph)=>{
          expect(err).to.exist;
          expect(err.message).to.equal('force error: ExecutionGraphResolverImpl.resolveExecutionGraph');
          expect(executionGraph).to.not.exist;
          done();
        });
      });
    });
  });
});

describe('Testing ExecutionGraphResolver.getFullResourcePath', () => {
  let executionGraphResolver: ExecutionGraphResolver;
  beforeEach(() => {
    executionGraphResolver = kernel.get<ExecutionGraphResolver>('ExecutionGraphResolver');
  });
  it('should return an error if url is undefined',(done)=>{
    let undefinedUrl:string;
    // noinspection JSUnusedAssignment
    executionGraphResolver.getFullResourcePath(undefinedUrl,null,(err, fullResourcePath)=>{
      expect(err).to.exist;
      expect(err.message).to.equal(`Parameter "url" must be a string, not undefined`);
      expect(fullResourcePath).to.not.exist;
      done();
    });
  });
  it('should return an error if url is null',(done)=>{
    const nullUrl = null;
    executionGraphResolver.getFullResourcePath(nullUrl,null,(err, fullResourcePath)=>{
      expect(err).to.exist;
      expect(err.message).to.equal(`Parameter "url" must be a string, not object`);
      expect(fullResourcePath).to.not.exist;
      done();
    });
  });
  it('should return an error if url is stupid',(done)=>{
    const stupidUrl = '*-*';
    executionGraphResolver.getFullResourcePath(stupidUrl,null,(err, fullResourcePath)=>{
      expect(err).to.exist;
      expect(err.message).to.equal(`Parameter "url" must be a string, not object`);
      expect(fullResourcePath).to.not.exist;
      done();
    });
  });
  it('should return full web path if passed full web path',(done)=>{
    const webUrl = 'http://www.yahoo.com/kimberly/clark.jpg';
    executionGraphResolver.getFullResourcePath(webUrl,null,(err, fullResourcePath)=>{
      expect(err).to.not.exist;
      expect(fullResourcePath).to.equal(webUrl);
      done();
    });
  });
  it('should return full filesystem path if passed full filesystem path',(done)=>{
    const filesystemUrl = '/var/local/ledbetter/grim.jpg';
    executionGraphResolver.getFullResourcePath(filesystemUrl,null,(err, fullResourcePath)=>{
      expect(err).to.not.exist;
      expect(fullResourcePath).to.equal(filesystemUrl);
      done();
    });
  });
  it('should return an error if url is valid partial but parentUrl is undefined',(done)=>{
    const partialUrl = 'svegney/blotter.jpg';
    let undefinedParentUrl:string;
    // noinspection JSUnusedAssignment
    executionGraphResolver.getFullResourcePath(partialUrl,undefinedParentUrl,(err, fullResourcePath)=>{
      expect(err).to.exist;
      expect(err.message).to.equal(`Parameter "url" must be a string, not undefined`);
      expect(fullResourcePath).to.not.exist;
      done();
    });
  });
  it('should return an error if url is valid partial but parentUrl is null',(done)=>{
    const partialUrl = 'svegney/blotter.jpg';
    let nullParentUrl=null;
    executionGraphResolver.getFullResourcePath(partialUrl,nullParentUrl,(err, fullResourcePath)=>{
      expect(err).to.exist;
      expect(err.message).to.equal(`Parameter "url" must be a string, not object`);
      expect(fullResourcePath).to.not.exist;
      done();
    });
  });
  it('should return full web path if url is valid partial and parentUrl is valid web url',(done)=>{
    const webUrl = 'photos/clark.jpg';
    const parentUrl = 'http://www.yahoo.com/cloomb/kimberly.jpg';
    executionGraphResolver.getFullResourcePath(webUrl,parentUrl,(err, fullResourcePath)=>{
      expect(err).to.not.exist;
      const expectedFullResourcePath = `${path.dirname(parentUrl)}/${webUrl}`;
      expect(fullResourcePath).to.equal(expectedFullResourcePath);
      done();
    });
  });
  it('should return full filesystem path if url is valid partial and parentUrl is valid filesystem url',(done)=>{
    const webUrl = 'photos/clark.jpg';
    const parentUrl = '/var/local/ledbetter/grim.jpg';
    executionGraphResolver.getFullResourcePath(webUrl,parentUrl,(err, fullResourcePath)=>{
      expect(err).to.not.exist;
      const expectedFullResourcePath = `${path.dirname(parentUrl)}/${webUrl}`;
      expect(fullResourcePath).to.equal(expectedFullResourcePath);
      done();
    });
  });
});
