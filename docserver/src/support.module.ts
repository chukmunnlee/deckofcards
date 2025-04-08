import { Module } from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';

import { WinstonModule, utilities } from 'nest-winston'
import * as winston from 'winston';

import { join } from 'path'
import { APP_NAME } from './constants'

const shared: any[] = [
  WinstonModule.forRoot({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: APP_NAME },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(), winston.format.ms(),
          utilities.format.nestLike(APP_NAME, {
            colors: true, prettyPrint: true, processId: true, appName: true
          })
        )
      })
    ]
  }),
  ServeStaticModule.forRoot({
    serveRoot: '/openapi',
    rootPath: join(__dirname, '..', 'static/openapi')
  })
]

@Module({
  imports: shared,
  exports: shared,
})
export class SupportModule { }
