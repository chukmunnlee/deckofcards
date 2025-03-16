import { Module } from '@nestjs/common';

import {AppController} from './controllers/app.controller';
import {ConfigService} from './services/config.service';
import {FactoryRepository} from './repositories/factory.repository';

import {DeckController} from './controllers/deck.controller';
import {DeckService} from './services/deck.service';
import {DeckRepository} from './repositories/deck.repository';

import {GameController} from './controllers/game.controller';
import {GameService} from './services/game.service';
import {GameRepository} from './repositories/game.repository';

@Module({
  imports: [],
  controllers: [ AppController, DeckController, GameController ],
  providers: [ ConfigService, FactoryRepository, 
    DeckRepository, DeckService, 
    GameRepository, GameService
  ],
})
export class AppModule {}
