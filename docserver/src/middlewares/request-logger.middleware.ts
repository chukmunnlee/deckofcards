import {Inject, Injectable, LoggerService, NestMiddleware} from "@nestjs/common";
import { Request, Response, NextFunction } from 'express'
import {WINSTON_MODULE_NEST_PROVIDER} from "nest-winston";

import { getClientIp } from 'request-ip'
import {ConfigService} from "src/services/config.service";
import * as strftime from "strftime";

@Injectable()
export class RequestLogger implements NestMiddleware {

  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService, 
      private readonly configSvc: ConfigService) {}

  use(request: Request, response: Response, next: NextFunction) {

    const { method, path } = request
    if (!path.startsWith(this.configSvc.prefix))
      return next()

    const remoteIP = getClientIp(request)
    const timestamp = strftime('%d/%b/%Y:%H:%M:%S %z', new Date())

    response.on('finish', async() => {
      return setTimeout(() => {
        const statusCode = response.statusCode
        const payloadSize = response.getHeader('Content-Length') ?? 0
        this.logger.log(`${remoteIP} - - [${timestamp}] "${method} ${path} HTTP/1.0" ${statusCode} ${payloadSize}`)
      }, 0)
    })

    next()
  }
}
