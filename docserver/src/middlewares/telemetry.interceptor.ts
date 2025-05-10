import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";
import {Observable, tap} from "rxjs";
import {ConfigService} from "src/services/config.service";

import {TelemetryService} from "src/services/telemetry.service";
import {forwarded} from "src/utils";

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
    const http = context.switchToHttp()
    const { method, url } = http.getRequest() 
    const host = forwarded(http.getRequest().headers)
    const start = Date.now()
    return next.handle()
      .pipe(
        tap(() => {
          this.telemetrySvc.httpRequestDurationMs.record(Date.now() - start, this.configSvc.metadata)
          const status = http.getResponse().statusCode
          this.telemetrySvc.httpRequestTotal.add(1, { ...this.configSvc.metadata, host, method, url, status })
        })
      )
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return this.interceptor(context, next)
  }
}
