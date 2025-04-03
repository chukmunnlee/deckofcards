import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module';

import * as express from 'express'
import {ConfigService} from './services/config.service';
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston';

async function bootstrap() {

  const app = express()

  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule
      , new ExpressAdapter(app))

  const configSvc = nestApp.get(ConfigService)

  if (configSvc.cors)
    nestApp.enableCors()

  nestApp.useLogger(nestApp.get(WINSTON_MODULE_NEST_PROVIDER))

  nestApp.disable('x-powered-by')
  nestApp.setGlobalPrefix(configSvc.prefix, {
    exclude: [ '/app/*path' ]
  })

  console.info(`Starting application on port ${configSvc.port} at ${new Date()}`)

  await nestApp.listen(configSvc.port)
}
bootstrap();
