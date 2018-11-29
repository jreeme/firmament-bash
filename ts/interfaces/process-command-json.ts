import {ForceError, RemoteCatalogEntry} from 'firmament-yargs';
import {ExecutionGraph} from "../custom-typings";

export interface ProcessCommandJson extends ForceError {
  processYargsCommand(argv: any);
  processExecutionGraph(executionGraph: ExecutionGraph, cb: (err: Error, result: any) => void);
  processExecutionGraphJson(json: string, cb: (err: Error, result: string) => void);
  processAbsoluteUrl(jsonOrUri: string, cb: (err: Error, result: string) => void);
  processCatalogEntry(catalogEntry: RemoteCatalogEntry, cb: (err: Error, result: string) => void): void;
}
