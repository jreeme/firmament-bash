import {ForceError, RemoteCatalogEntry} from 'firmament-yargs';
import {ExecutionGraph} from "../custom-typings";

export interface ProcessCommandJson extends ForceError {
  execute(executionGraph: ExecutionGraph, cb: (err: Error, result: any) => void);
  processYargsCommand(argv: any);
  processExecutionGraphJson(json: string, cb: (err: Error, result: string) => void): void;
  processAbsoluteUrl(jsonOrUri: string, cb: (err: Error, result: string) => void): void;
  processCatalogEntry(catalogEntry: RemoteCatalogEntry, cb: (err: Error, result: string) => void): void;
}
