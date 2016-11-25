import {injectable, inject} from 'inversify';
import {ProcessCommandJson} from "../interfaces/process-command-json";
import {CommandUtil, ForceErrorImpl} from "firmament-yargs";
import {ExecutionGraph} from "../interfaces/execution-graph";
import path = require('path');
import fs = require('fs');
import url = require('url');
import request = require('request');
const fileExists = require('file-exists');

@injectable()
export class ProcessCommandJsonImpl extends ForceErrorImpl implements ProcessCommandJson {
  private commandUtil: CommandUtil;

  constructor(@inject('CommandUtil')_commandUtil: CommandUtil) {
    super();
    this.commandUtil = _commandUtil;
  }

  process(jsonOrUri: string, cb: (err: Error, result: string)=>void): void {
    cb = this.checkCallback(cb);
    if (this.checkForceError('ProcessCommandJsonImpl.process', cb)) {
      return;
    }
    this.resolveExecutionGraph(jsonOrUri, (err, executionGraph) => {
      if (this.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      this.execute(executionGraph, cb);
    });
  }

  private execute(executionGraph: ExecutionGraph, cb: (err: Error, result: string)=>void) {
    cb = this.checkCallback(cb);
    /*    if (executionGraph.prerequisiteGraph) {
     if (typeof executionGraph.prerequisiteGraph === 'string') {
     this.execute(executionGraph.prerequisiteGraph, (err: Error, result: string) => {
     if (this.commandUtil.callbackIfError(cb, err)) {
     return;
     }
     executionGraph.prerequisiteGraph = subExecutionGraph;
     cb(null, executionGraph);
     });
     } else if (typeof executionGraph.prerequisiteGraph === 'Object') {
     cb(null, executionGraph);
     }
     } else {
     cb(null, executionGraph);
     }*/
  }

  private resolveExecutionGraph(jsonOrUri: string, cb: (err: Error, executionGraph: ExecutionGraph)=>void) {
    cb = this.checkCallback(cb);
    this.resolveJsonString(jsonOrUri, (err: Error, json: string) => {
      if (this.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      let executionGraph: ExecutionGraph;
      try {
        executionGraph = JSON.parse(json);
      } catch (err) {
        cb(err, null);
        return;
      }
      if (executionGraph.prerequisiteGraphUri) {
        this.resolveExecutionGraph(executionGraph.prerequisiteGraphUri, (err: Error, subExecutionGraph: ExecutionGraph) => {
          if (this.commandUtil.callbackIfError(cb, err)) {
            return;
          }
          executionGraph.prerequisiteGraph = subExecutionGraph;
        });
      } else {
        cb(null, executionGraph);
      }
    });
  }

  //Right now uri can be a web address (http(s)://somewhere.com/some.json) or an absolute path (/tmp/some.json)
  //or a path relative to cwd (subdir/some.json)
  private resolveJsonString(uri: string, cb: (err: Error, json: string)=>void) {
    cb = this.checkCallback(cb);
    try {
      let parsedUri = url.parse(uri);
      if (!parsedUri.protocol) {
        //Not a web address, maybe a local file
        uri = path.isAbsolute(uri) ? uri : path.resolve(process.cwd(), uri);
        if (!fileExists(uri)) {
          cb(new Error(`${uri} doesn't exist`), null);
          return;
        }
        cb(null, fs.readFileSync(uri, 'utf8'));
        return;
      }
      //Let's look on the web
      request(uri, (err, res, body) => {
        (res.statusCode != 200)
          ? cb(new Error('URI not found'), null)
          : cb(err, body);
      });
    }
    catch (err) {
      cb(err, null);
    }
  }
}
