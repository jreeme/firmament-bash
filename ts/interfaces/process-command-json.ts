import {ForceError} from "firmament-yargs";
export interface ProcessCommandJson extends ForceError {
  process(jsonOrUri:string, cb:(err:Error, result:string)=>void):void;
}
