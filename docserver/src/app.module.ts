import { Module } from '@nestjs/common';

import {ConfigService} from './services/config.service';
import {AppController} from './controllers/app.controller';
import {FactoryRepository} from './repositories/factory.repository';
import {DeckRepository} from './repositories/deck.repository';
import {DeckController} from './controllers/deck.controller';
import {DeckService} from './services/deck.service';
import {GameRepository} from './repositories/game.repository';

@Module({
  imports: [],
  controllers: [ AppController, DeckController ],
  providers: [ ConfigService, FactoryRepository, 
    DeckRepository, DeckService, 
    GameRepository
  ],
})
export class AppModule {}
