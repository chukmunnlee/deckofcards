import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";
import {Span, context as otelContext, trace } from "@opentelemetry/api";
import {catchError, finalize, Observable, tap, throwError} from "rxjs";
import {ConfigService} from "src/services/config.service";

import {TelemetryService} from "src/services/telemetry.service";
import {forwarded} from "src/utils/utils";

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {

  private readonly interceptor: (_ctx: ExecutionContext, _next: CallHandler<any>) => Observable<any> | Promise<Observable<any>>

  constructor(private readonly telemetrySvc: TelemetryService, private readonly configSvc: ConfigService) { 
    if (configSvc.instrumentation)
      this.interceptor = this.measure
    else
      this.interceptor = this.passthru
  }

  private passthru(_: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle()
  }

  private createSpan(name: string): Span {
    const tracer = this.telemetrySvc.getTracer();
    return tracer.startSpan(name)
  }

  private measure(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const http = context.switchToHttp()
    const req = http.getRequest()
    const { method, url, params } = req
    const host = forwarded(http.getRequest().headers)
    const start = Date.now()
    const span = this.createSpan(url)
    let status = 200
    return otelContext.with(
      trace.setSpan(otelContext.active(), span),
      () => next.handle()
        .pipe(
          tap(() => { 
            status = http.getResponse().statusCode
          }),
          catchError(err => {
            status = err.status
            span.recordException(err)
            return throwError(() => err)
          }),
          finalize(() => { 
            this.telemetrySvc.httpRequestDurationMs.record(Date.now() - start, this.configSvc.metadata)
            const spanId = span.spanContext().spanId
            span.setStatus({ code: status })
            const attrs = { ...this.configSvc.metadata, host, method, url, status, span_id: spanId }
            if (!!params?.deckId)
              attrs['deck_id'] = params?.deckId
            if (!!params?.gameId)
              attrs['game_id'] = params?.gameId
            this.telemetrySvc.httpRequestTotal.add(1, attrs)
            span.end()
          })
        )
    )
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return this.interceptor(context, next)
  }
}
