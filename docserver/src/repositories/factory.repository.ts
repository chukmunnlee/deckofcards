import {Inject, Injectable, LoggerService} from "@nestjs/common";

import { ConfigService } from '../services/config.service'
import {Collection, Document, MongoClient} from "mongodb";
import {WINSTON_MODULE_NEST_PROVIDER} from "nest-winston";

@Injectable()
export class FactoryRepository {

  private cilent!: MongoClient

  constructor(private readonly configSvc: ConfigService, 
      @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) { }

  async ensureSetup() {

    if (!!this.cilent)
      return

    this.logger.log('Creating MongoDB client', FactoryRepository.name)

    this.cilent = new MongoClient(this.configSvc.mongodbUri)
  }

  collection(colName: string): Collection {
    this.ensureSetup()
    return this.cilent.db(this.configSvc.database).collection(colName)
  }

  ping(): Promise<Document> {
    return this.cilent.db(this.configSvc.database).stats()
  }
}
