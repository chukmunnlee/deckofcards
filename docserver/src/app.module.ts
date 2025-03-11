import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import {ConfigService} from './services/config.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [ ConfigService ],
})
export class AppModule {}
