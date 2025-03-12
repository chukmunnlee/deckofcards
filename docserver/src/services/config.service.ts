import {Injectable, OnModuleInit} from "@nestjs/common";
import {Deck} from "src/models/deck";
import {loadDecks} from "src/utils";

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'

const USAGE = `Usage: $0 --cors --port [number] --games [number] 
    --decksDir [directory] --staticDir [directory] 
    --drop --database [database name]  --mongodbUri [string]`

const DEFAULT_PORT = '3000'
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017'
const DEFAULT_DATABASE = 'deckofcards'

@Injectable()
export class ConfigService {

  private argv!: any

  get cors() { return this.argv.cors }
  get port() { return this.argv.port }
  get decksDir() { return this.argv.decksDir }
  get drop() { return this.argv.drop }
  get database() { return this.argv.database }
  get mongodbUri() { return this.argv.mongodbUri }

  get config() {
    return {
      cors: !!this.argv.cors,
      port: this.argv.port
    }
  }

  constructor() {
    this.argv = yargs(hideBin(process.argv))
        .usage(USAGE)
        .boolean([ 'cors' ])
        .default('port', parseInt(process.env.PORT ?? DEFAULT_PORT))
        .default('mongodbUri', process.env.MONGODB_URI || DEFAULT_MONGODB_URI)
        .default('decksDir', process.env.DECKS_DIR || '')
        .default('database', process.env.DATABASE || DEFAULT_DATABASE)
        .default('drop', !!process.env.DROP)
        .parse()
  }

}
