import {injectable, inject} from 'inversify';
import {ProcessCommandJson} from "../interfaces/process-command-json";
import {CommandUtil, ForceErrorImpl} from "firmament-yargs";

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
    jsonOrUri = jsonOrUri || '';

    cb(null, null);
  }

  private getJsonStringFromUri(uri:string):string{
    return '';
  }
}
