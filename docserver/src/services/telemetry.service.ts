import {Inject, Injectable, LoggerService} from "@nestjs/common";

import {WINSTON_MODULE_NEST_PROVIDER} from "nest-winston";

import {Counter, Histogram, Meter, ObservableGauge, trace, Tracer} from "@opentelemetry/api";
import {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} from "@opentelemetry/semantic-conventions";

import {ConfigService} from "./config.service";
import { GAME_CURRENT_TOTAL, GAME_TOTAL, HTTP_REQUEST_DURATION_MS, HTTP_REQUEST_TOTAL, TELEMETRY } from '../constants'
import {GameService} from "./game.service";

@Injectable()
export class TelemetryService {

  httpRequestTotal: Counter
  httpRequestDurationMs: Histogram
  gameTotal: Counter
  gameCurrentTotal: ObservableGauge

  private meter: Meter
  private tracer: Tracer

  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService, 
      @Inject(TELEMETRY) private readonly telemetry: { [key: string]: any },
      private readonly configSvc: ConfigService, private readonly gameSvc: GameService) { 

    this.meter = this.telemetry.meter
    this.tracer = this.telemetry.tracer

    this.makeMetrics()
  }

  getTracer(): Tracer {
    return this.tracer
  }

  stop() {
    this.telemetry.sdk.shutdown()
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
