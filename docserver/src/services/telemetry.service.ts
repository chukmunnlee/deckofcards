import {Inject, Injectable, LoggerService} from "@nestjs/common";

import {WINSTON_MODULE_NEST_PROVIDER} from "nest-winston";

import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import {MeterProvider, PeriodicExportingMetricReader} from "@opentelemetry/sdk-metrics";
import {Counter, Gauge, Histogram, Meter} from "@opentelemetry/api";
import {NodeSDK} from "@opentelemetry/sdk-node";
import {resourceFromAttributes} from "@opentelemetry/resources";
import {getNodeAutoInstrumentations} from "@opentelemetry/auto-instrumentations-node";

import {ConfigService} from "./config.service";
import { GAME_CURRENT_TOTAL, GAME_DURATION_SECONDS, GAME_TOTAL, HTTP_REQUEST_CURRENT_TOTAL, HTTP_REQUEST_DURATION_MS, HTTP_REQUEST_TOTAL } from '../constants'

@Injectable()
export class TelemetryService {

  httpRequestTotal: Counter
  httpRequestCurrentTotal: Gauge
  httpRequestDurationMs: Histogram
  gameTotal: Counter
  gameCurrentTotal: Gauge
  gameDurationSeconds: Histogram

  private prom: PrometheusExporter
  private meterProv: MeterProvider
  private meter: Meter
  private metricReader: PeriodicExportingMetricReader
  private sdk: NodeSDK
  private readonly metrics = {}

  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService, 
      private readonly configSvc: ConfigService) { 

    this.prom = new PrometheusExporter(
      { port: this.configSvc.metricsPort, endpoint: this.configSvc.metricsPrefix,
        preventServerStart: true },
      () => this.logger.log(`Telemetry: port:${this.configSvc.metricsPort} prefix: ${this.configSvc.metricsPrefix}`
        , TelemetryService.name)
    )

    this.meterProv = new MeterProvider({ readers: [ this.prom ], views: [], 
      resource: resourceFromAttributes(this.configSvc.metadata)
    })
    this.meter = this.meterProv.getMeter(this.configSvc.hash)

    this.metricReader = new PeriodicExportingMetricReader({
      //@ts-ignore
      exporter: this.prom,
      exportIntervalMillis: this.configSvc.exportInterval * 1000,
    })

    this.sdk = new NodeSDK({
      resource: resourceFromAttributes(this.configSvc.metadata),
      metricReader: this.metricReader,
      instrumentations: [ getNodeAutoInstrumentations() ]
    })
  }

  start() {
    this.makeMetrics()
    return this.prom.startServer()
  }
  stop() {
    return this.prom.shutdown()
  }

  private makeMetrics() {
    // HTTP metrics
    this.httpRequestTotal = this.meter.createCounter(HTTP_REQUEST_TOTAL, 
      { description: 'Total number of request', unit: 'int' })
    this.httpRequestCurrentTotal = this.meter.createGauge(HTTP_REQUEST_CURRENT_TOTAL,
      { description: 'Total number of inflight request', unit: 'int' })
    this.httpRequestDurationMs = this.meter.createHistogram(HTTP_REQUEST_DURATION_MS,
      { description: 'Request duration in milliseconds', unit: 'int' })

    // Game metrics
    this.gameTotal = this.meter.createCounter(GAME_TOTAL,
      { description: 'Total number of games', unit: 'int' })
    this.gameCurrentTotal = this.meter.createGauge(GAME_CURRENT_TOTAL,
      { description: 'Total number of running games', unit: 'int' })
    this.gameDurationSeconds = this.meter.createHistogram(GAME_DURATION_SECONDS,
      { description: 'Game duration in seconds', unit: 'int' })
  }
}
