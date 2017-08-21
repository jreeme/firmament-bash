import {inject, injectable} from 'inversify';
import {CommandUtil, ForceErrorImpl, RemoteCatalogEntry, RemoteCatalogGetter} from "firmament-yargs";
import {ExecutionGraphResolver} from "../interfaces/execution-graph-resolver";
import {ExecutionGraph} from "../custom-typings";
import {Url} from 'url';
import path = require('path');
import nodeUrl = require('url');
import * as _ from 'lodash';

@injectable()
export class ExecutionGraphResolverImpl extends ForceErrorImpl implements ExecutionGraphResolver {
  constructor(@inject('CommandUtil') private commandUtil: CommandUtil,
              @inject('RemoteCatalogGetter') private remoteCatalogGetter: RemoteCatalogGetter) {
    super();
  }

  resolveExecutionGraph(url: string, cb: (err: Error, executionGraph?: ExecutionGraph) => void) {
    const me = this;
    cb = me.checkCallback(cb);
    me.remoteCatalogGetter.resolveJsonObjectFromUrl(url, (err, jsonObject) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      if (!jsonObject) {
        cb(new Error(`Execution graph at '${url}' not found`));
        return;
      }
      const executionGraph = <ExecutionGraph>jsonObject;
      if (executionGraph.prerequisiteGraphUri) {
        me.resolveExecutionGraph(ExecutionGraphResolverImpl.getFullResourcePath(executionGraph.prerequisiteGraphUri, url),
          (err: Error, subExecutionGraph: ExecutionGraph) => {
            if (me.commandUtil.callbackIfError(cb, err)) {
              return;
            }
            executionGraph.prerequisiteGraph = subExecutionGraph;
            cb(null, executionGraph);
          });
      } else {
        cb(null, executionGraph);
      }
    });
  }

  resolveExecutionGraphFromCatalogEntry(catalogEntry: RemoteCatalogEntry, cb: (err: Error, executionGraph?: ExecutionGraph) => void) {
    const me = this;
    cb = me.checkCallback(cb);
    try {
      catalogEntry.resources.forEach(resource => {
        const po = resource.parsedObject;
        const preReqUri = po.prerequisiteGraphUri;
        if (preReqUri) {
          const preReq = _.find(catalogEntry.resources, r => {
            return r.name === preReqUri;
          });
          po.prerequisiteGraph = preReq.parsedObject;
          preReq.parsedObject.parent = resource;
        }
      });
      //Find graph with no parent and we know where to start
      const startGraph: ExecutionGraph = (_.find(catalogEntry.resources, resource => {
        return !resource.parsedObject.parent;
      })).parsedObject;

      cb(null, startGraph);
    } catch (err) {
      cb(err);
    }
  }

  private static getFullResourcePath(url: string, parentUrl: string): string {
    let retVal: string;
    const parsedUrl: Url = nodeUrl.parse(url);
    //First, figure out if it's a network resource or filesystem resource
    if (parsedUrl.protocol) {
      //Network resource
      retVal = url;
    } else {
      //Filesystem resource
      if (path.isAbsolute(url)) {
        retVal = url;
      } else {
        const parsedParentUrl: Url = nodeUrl.parse(parentUrl);
        let baseUrl = path.dirname(parentUrl);
        if (parsedParentUrl.protocol) {
          baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${path.dirname(parsedUrl.path)}`;
        }
        retVal = path.resolve(baseUrl, url);
      }
    }
    return retVal;
  }
}
