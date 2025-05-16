import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module';

import * as express from 'express'

import {ConfigService} from './services/config.service';
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston';
//import {loadTelemetry} from './otel';

async function bootstrap() {

  // IMPORTANT: loadTelemetry MUST start before the main application
  //loadTelemetry()

  const app = express()

  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule
      , new ExpressAdapter(app))

  const configSvc = nestApp.get(ConfigService)
  const loggerSvc = nestApp.get(WINSTON_MODULE_NEST_PROVIDER)

  if (configSvc.cors)
    nestApp.enableCors()

  nestApp.useLogger(nestApp.get(WINSTON_MODULE_NEST_PROVIDER))

  nestApp.disable('x-powered-by')
  nestApp.setGlobalPrefix(configSvc.prefix, {
    exclude: [ '/app/*path', '/openapi{/*path}' ]
  })

  await nestApp.listen(configSvc.port)
      .then(() => {
        loggerSvc.log(`Starting application on port ${configSvc.port} at ${new Date()}`, 'bootstrap')
        if (configSvc.instrumentation)
          loggerSvc.log(`OTel endpoint at ${configSvc.otelUri}`)
        else
          loggerSvc.log('Instrumentation is not enabled')
      })

}

bootstrap();
