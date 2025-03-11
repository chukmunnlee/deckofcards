import {Injectable, OnModuleInit} from "@nestjs/common";

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'

const USAGE = `Usage: $0 --cors --port [number] --games [number] 
    --decksDir [directory] --staticDir [directory] --prefix [resource prefix]
    --drop --mongodbUri [string]`

const DEFAULT_PORT = '3000'
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/deckofcards'

@Injectable()
export class ConfigService implements OnModuleInit {

  private argv!: any

  get cors() { return this.argv.cors }
  get port() { return this.argv.port }
  get mongodbUri() { return this.argv.mongodbUri }

  constructor() {
    this.argv = yargs(hideBin(process.argv))
        .usage(USAGE)
        .boolean([ 'cors' ])
        .default('port', parseInt(process.env.PORT ?? DEFAULT_PORT))
        .default('mongodbUri', process.env.MONGODB_URI || DEFAULT_MONGODB_URI)
        .parse()
  }

  onModuleInit() {
    
  }
}
