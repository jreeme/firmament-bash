import {ForceError, RemoteCatalogEntry} from 'firmament-yargs';
export interface ProcessCommandJson extends ForceError {
  processYargsCommand(argv: any);
  processAbsoluteUrl(jsonOrUri: string, cb: (err: Error, result: string) => void): void;
  processCatalogEntry(catalogEntry: RemoteCatalogEntry, cb: (err: Error, result: string) => void): void;
}
