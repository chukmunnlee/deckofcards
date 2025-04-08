import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";
import {Observable, tap} from "rxjs";
import {ConfigService} from "src/services/config.service";

import {TelemetryService} from "src/services/telemetry.service";

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {

  constructor(private readonly telemetrySvc: TelemetryService, 
      private readonly configSvc: ConfigService) { }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const meta = { ...this.configSvc.metadata }
    return next.handle()
      .pipe(
        tap(() => {
        })
      )
    
  }
}
