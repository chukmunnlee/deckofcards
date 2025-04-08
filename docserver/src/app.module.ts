import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

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
import {SupportModule} from './support.module';
import {TelemetryService} from './services/telemetry.service';

@Module({
  imports: [ SupportModule ],
  controllers: [ AppController, DeckController, GameController, SwaggerController ],
  providers: [ ConfigService, FactoryRepository, 
    DeckRepository, DeckService, 
    GameRepository, GameService,
    RequestLogger, TelemetryService
  ],
})
export class AppModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    const path = '/*path'
    consumer.apply(RequestLogger).forRoutes({
      path, method: RequestMethod.ALL
    })
  }
}
