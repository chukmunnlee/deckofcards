import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { v4 as uuidv4 } from 'uuid'
import {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} from '@opentelemetry/semantic-conventions';

const { name, version } = require('../../package.json')

const USAGE = `Usage: $0 --cors --id [string|random]
    --port [number|3000] --prefix [string|/api]
    --games [number] --decksDir [directory] --inactivity [minutes|30]
    --instrumentation [boolean|false] --otelUri [string|http://localhost:4317] --exportInterval [seconds|30]
    --drop --database [database name|deckofcards] --mongodbUri [string|mongodb://localhost:27017]`

const DEFAULT_PORT = '3000'
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017'
const DEFAULT_DATABASE = 'deckofcards'
const DEFAULT_PREFIX = '/api'
const DEFAULT_INACTIVE = '30'
const DEFAULT_EXPORT_INTERVAL = '30'
const DEFAULT_OTEL_ENDPOINT = 'http://localhost:4317'

export const parseCLI = (): any => {
  const opts = yargs(hideBin(process.argv))
        .usage(USAGE)
        .boolean([ 'cors', 'drop' ])
        .default('port', parseInt(process.env.PORT ?? DEFAULT_PORT))
        .default('mongodbUri', process.env.MONGODB_URI || DEFAULT_MONGODB_URI)
        .default('decksDir', process.env.DECKS_DIR || '')
        .default('database', process.env.DATABASE || DEFAULT_DATABASE)
        .default('prefix', process.env.PREFIX || DEFAULT_PREFIX)
        .default('inactive', parseInt(process.env.INACTIVE || DEFAULT_INACTIVE))
        .default('instrumentation', !!process.env.INSTRUMENTATION)
        .default('otelUri', process.env.OTEL_ENDPOINT || DEFAULT_OTEL_ENDPOINT)
        .default('exportInterval', parseInt(process.env.EXPORT_INTERVAL || DEFAULT_EXPORT_INTERVAL))
        .default('hash', process.env.HASH || uuidv4().toString().substring(0, 8)) 
        .parse()

  opts[ATTR_SERVICE_NAME] = name
  opts[ATTR_SERVICE_VERSION] = version
  opts['env'] = process.env.NODE_ENV || 'development'

  opts['metadata'] = {
    [ATTR_SERVICE_NAME]: name,
    [ATTR_SERVICE_VERSION]: version,
    'hash': opts['hash'],
    'env': opts['env']
  }

  return opts
}

