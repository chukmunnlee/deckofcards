import {Injectable} from "@nestjs/common";

import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { v4 as uuidv4 } from 'uuid'

import { APP_NAME, APP_VERSION } from '../constants'
const { name, version } = require('../../package.json')

const USAGE = `Usage: $0 --cors --id [string|random]
    --port [number|3000] --prefix [string|/api]
    --games [number] --decksDir [directory] --inactivity [minutes|30]
    --metricsPort [number|9464] --metricsPrefix [string|/metrics] --exportInterval [seconds|30]
    --drop --database [database name|deckofcards] --mongodbUri [string]`

const DEFAULT_PORT = '3000'
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017'
const DEFAULT_DATABASE = 'deckofcards'
const DEFAULT_PREFIX = '/api'
const DEFAULT_INACTIVE = '30'
const DEFAULT_METRICS_PORT = '9464' // 9464
const DEFAULT_METRICS_PREFIX = '/metrics'
const DEFAULT_EXPORT_INTERVAL = '30'

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
  get metricsPort() { return this.argv.metricsPort }
  get metricsPrefix() { return this.argv.metricsPrefix }
  get exportInterval() { return this.argv.exportInterval }
  get hash() { return this.argv.hash }
  get metadata() {
    return {
      [ATTR_SERVICE_NAME]: name,
      [ATTR_SERVICE_VERSION]: version,
      'hash': this.argv.hash,
      'environment': this.env
    }
  }

  set ready(r: number) { this.argv.ready = r }
  get ready(): number { return this.argv.ready }
  get env(): string { return process.env.NODE_ENV || 'development' }

  get config() {
    return {
      hash: this.argv.hash,
      cors: !!this.argv.cors,
      port: this.argv.port,
      prefix: this.argv.prefix,
      metricsPort: this.argv.metricsPort,
      metricsPrefix: this.argv.metricsPrefix,
      exportInterval: this.argv.exportInterval,
      ready: this.argv.ready
    }
  }

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
        .default('metricsPort', parseInt(process.env.METRICS_PORT || DEFAULT_METRICS_PORT))
        .default('metricsPrefix', process.env.METRICS_PREFIX || DEFAULT_METRICS_PREFIX)
        .default('exportInterval', parseInt(process.env.EXPORT_INTERVAL || DEFAULT_EXPORT_INTERVAL))
        .default('hash', process.env.HASH || uuidv4().toString().substring(0, 8)) 
        .parse()
    this.argv.ready = 0
    this._inactive = this.argv.inactive * 60 * 1000
  }

}
