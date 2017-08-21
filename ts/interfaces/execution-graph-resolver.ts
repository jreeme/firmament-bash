import {ForceError, RemoteCatalogEntry} from 'firmament-yargs';
import {ExecutionGraph} from "../custom-typings";

export interface ExecutionGraphResolver extends ForceError {
  resolveExecutionGraph(url: string, cb: (err: Error, executionGraph?: ExecutionGraph) => void);
  resolveExecutionGraphFromCatalogEntry(catalogEntry: RemoteCatalogEntry, cb: (err: Error, executionGraph?: ExecutionGraph) => void);
  getFullResourcePath(url: string, parentUrl: string, cb: (err: Error, fullResourcePath: string) => void);
}
