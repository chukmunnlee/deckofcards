import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";
import {Observable, tap} from "rxjs";
import {ConfigService} from "src/services/config.service";

import {TelemetryService} from "src/services/telemetry.service";

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {

  private readonly interceptor: (_ctx: ExecutionContext, _next: CallHandler<any>) => Observable<any> | Promise<Observable<any>>

  constructor(private readonly telemetrySvc: TelemetryService, private readonly configSvc: ConfigService) { 
    if (configSvc.metricsPort <= 0)
      this.interceptor = this.passthru
    else
      this.interceptor = this.measure

  }

  private passthru(_: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle()
  }

  private measure(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const meta = { ...this.configSvc.metadata }
    return next.handle()
      .pipe(
        tap(() => {
          console.info('>>>> in measure')
        })
      )
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return this.interceptor(context, next)
  }
}
