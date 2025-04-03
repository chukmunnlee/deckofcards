import {Injectable} from "@nestjs/common";

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import * as swagger from 'swagger-ui-dist'

const USAGE = `Usage: $0 --cors --port [number] 
    --games [number]  --inactivity [minutes]
    --decksDir [directory] --staticDir [directory] 
    --prefix [resource prefix]
    --drop --database [database name] --mongodbUri [string]`

const DEFAULT_PORT = '3000'
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017'
const DEFAULT_DATABASE = 'deckofcards'
const DEFAULT_PREFIX = '/api'
const DEFAULT_INACTIVE = '30'

@Injectable()
export class ConfigService {

  private argv!: any
  private _inactive!: number

  get cors() { return this.argv.cors }
  get port() { return this.argv.port }
  get decksDir() { return this.argv.decksDir }
  get drop() { return this.argv.drop }
  get prefix() { return this.argv.prefix }
  get database() { return this.argv.database }
  get mongodbUri() { return this.argv.mongodbUri }
  get inactive() { return this._inactive }
  get swaggerUI() { return this._swaggerPath }

  set ready(r: number) { this.argv.ready = r }
  get ready(): number { return this.argv.ready }

  get config() {
    return {
      cors: !!this.argv.cors,
      port: this.argv.port,
      prefix: this.argv.prefix,
      ready: this.argv.ready
    }
  }

  private readonly _swaggerPath: string

  constructor() {
    this.argv = yargs(hideBin(process.argv))
        .usage(USAGE)
        .boolean([ 'cors', 'drop' ])
        .default('port', parseInt(process.env.PORT ?? DEFAULT_PORT))
        .default('mongodbUri', process.env.MONGODB_URI || DEFAULT_MONGODB_URI)
        .default('decksDir', process.env.DECKS_DIR || '')
        .default('database', process.env.DATABASE || DEFAULT_DATABASE)
        .default('prefix', process.env.PREFIX || DEFAULT_PREFIX)
        .default('inactive', parseInt(process.env.INACTIVE || DEFAULT_INACTIVE))
        .parse()
    this.argv.ready = 0
    this._inactive = this.argv.inactive * 60 * 1000
    this._swaggerPath = swagger.getAbsoluteFSPath()
  }

}
