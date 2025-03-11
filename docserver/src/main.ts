import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module';

import * as express from 'express'
import {ConfigService} from './services/config.service';

async function bootstrap() {

  const app = express()

  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule
      , new ExpressAdapter(app))

  const configSvc = nestApp.get(ConfigService)

  if (configSvc.cors)
    nestApp.enableCors()

  console.info(`Starting application on port ${configSvc.port} at ${new Date()}`)

  await nestApp.listen(configSvc.port)
}
bootstrap();
