import { Inject, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { WinstonModule, utilities } from 'nest-winston'
import * as winston from 'winston';

import {AppController} from './controllers/app.controller';
import {ConfigService} from './services/config.service';
import {FactoryRepository} from './repositories/factory.repository';


import {DeckController} from './controllers/deck.controller';
import {DeckService} from './services/deck.service';
import {DeckRepository} from './repositories/deck.repository';

import {GameController} from './controllers/game.controller';
import {GameService} from './services/game.service';
import {GameRepository} from './repositories/game.repository';
import {RequestLogger} from './middlewares/request-logger.middleware';

import { SwaggerController } from './controllers/swagger.controller';

const APP_NAME = 'deckofcards'

@Module({
  imports: [ 
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
    }) ],
  controllers: [ AppController, DeckController, GameController, SwaggerController ],
  providers: [ ConfigService, FactoryRepository, 
    DeckRepository, DeckService, 
    GameRepository, GameService,
    RequestLogger
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configSvc: ConfigService) { }

  configure(consumer: MiddlewareConsumer) {
    const path = '/*path'
    consumer.apply(RequestLogger).forRoutes({
      path, method: RequestMethod.ALL
    })
  }
}
