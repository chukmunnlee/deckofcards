import {Inject, Injectable, LoggerService} from "@nestjs/common";

import {WINSTON_MODULE_NEST_PROVIDER} from "nest-winston";

import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import {MeterProvider, PeriodicExportingMetricReader} from "@opentelemetry/sdk-metrics";
import {Counter, Histogram, Meter, metrics, ObservableGauge, trace, Tracer} from "@opentelemetry/api";
import {NodeSDK} from "@opentelemetry/sdk-node";
import {resourceFromAttributes} from "@opentelemetry/resources";
import {getNodeAutoInstrumentations} from "@opentelemetry/auto-instrumentations-node";
import {registerInstrumentations} from "@opentelemetry/instrumentation";
import {BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor} from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} from "@opentelemetry/semantic-conventions";
import { MongoDBInstrumentation } from "@opentelemetry/instrumentation-mongodb";

import {ConfigService} from "./config.service";
import { GAME_CURRENT_TOTAL, GAME_TOTAL, HTTP_REQUEST_DURATION_MS, HTTP_REQUEST_TOTAL } from '../constants'
import {GameService} from "./game.service";

@Injectable()
export class TelemetryService {

  httpRequestTotal: Counter
  httpRequestDurationMs: Histogram
  gameTotal: Counter
  gameCurrentTotal: ObservableGauge

  //private prom: PrometheusExporter
  private meter: Meter
  private metricReader: PeriodicExportingMetricReader
  private sdk: NodeSDK

  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService, 
      private readonly configSvc: ConfigService, private readonly gameSvc: GameService) { 

    const OTEL_ENDPOINT = 'http://localhost:4317'

    if (this.configSvc.metricsPort < 0) {
      this.logger.log('Telemetry is not enabled')
      return
    }

    //this.prom = new PrometheusExporter(
    //  { port: this.configSvc.metricsPort, endpoint: this.configSvc.metricsPrefix,
    //    preventServerStart: true },
    //  () => this.logger.log(`Telemetry: port:${this.configSvc.metricsPort} prefix: ${this.configSvc.metricsPrefix}`
    //    , TelemetryService.name)
    //)

    const metricExporter = new OTLPMetricExporter({ 
      url: `${OTEL_ENDPOINT}/v1/metrics`,
      concurrencyLimit: 1
    })

    this.meter = metrics.getMeter(this.configSvc.metadata[ATTR_SERVICE_NAME])

    this.metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: this.configSvc.exportInterval * 1000,
    })

    const traceExporter = new OTLPTraceExporter({
      url: `${OTEL_ENDPOINT}/v1/traces`,
      concurrencyLimit: 1
    })
    const spanProcessor = new BatchSpanProcessor(traceExporter)
    //const spanProcessor = new SimpleSpanProcessor(new ConsoleSpanExporter())

    this.sdk = new NodeSDK({
      resource: resourceFromAttributes(this.configSvc.metadata),
      metricReader: this.metricReader,
      spanProcessor,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-http': { 
            applyCustomAttributesOnSpan: (span) => {
              span.setAttribute('hash', this.configSvc.hash)
            }
          },
          '@opentelemetry/instrumentation-mongodb': { 
            enabled: true, enhancedDatabaseReporting: true,
            responseHook: (span, info) => {
              span.setAttribute('hash', this.configSvc.hash)
            }
          },
          '@opentelemetry/instrumentation-nestjs-core': { enabled: true }
        }),
      ]
    })
  }

  getTracer(): Tracer {
    return trace.getTracer(this.configSvc.metadata[ATTR_SERVICE_NAME]
        , this.configSvc.metadata[ATTR_SERVICE_VERSION])
  }

  start() {
    this.makeMetrics()
    this.sdk.start()
  }
  stop() {
    this.sdk.shutdown()
  }

  private makeMetrics() {
    // HTTP metrics
    this.httpRequestTotal = this.meter.createCounter(HTTP_REQUEST_TOTAL, 
      { description: 'Total number of request', unit: 'int' })
    this.httpRequestDurationMs = this.meter.createHistogram(HTTP_REQUEST_DURATION_MS,
      { description: 'Request duration in milliseconds', unit: 'int' })

    // Game metrics
    this.gameTotal = this.meter.createCounter(GAME_TOTAL,
      { description: 'Total number of games', unit: 'int' })
    this.gameCurrentTotal = this.meter.createObservableGauge(GAME_CURRENT_TOTAL, {
      unit: 'int', description: 'Total number of running games'
    })
    this.gameCurrentTotal.addCallback((result) => 
      this.gameSvc.getRunningGames(this.configSvc.inactive)
        .then(games => result.observe(games.length, this.configSvc.metadata))
    )
  }
}
