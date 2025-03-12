import { Module } from '@nestjs/common';

import {ConfigService} from './services/config.service';
import {AppController} from './controllers/app.controller';
import {FactoryRepository} from './repositories/factory.repository';
import {DeckRepository} from './repositories/deck.repository';

@Module({
  imports: [],
  controllers: [ AppController ],
  providers: [ ConfigService, FactoryRepository, 
    DeckRepository
  ],
})
export class AppModule {}
