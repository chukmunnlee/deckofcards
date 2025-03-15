import {Injectable} from "@nestjs/common";

import { ConfigService } from '../services/config.service'
import {Collection, Document, MongoClient} from "mongodb";

@Injectable()
export class FactoryRepository {

  private cilent!: MongoClient

  constructor(private readonly configSvc: ConfigService) { }

  async ensureSetup() {

    if (!!this.cilent)
      return

    console.info('Creating MongoDB client')

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
