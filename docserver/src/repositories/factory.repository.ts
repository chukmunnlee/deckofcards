import {Injectable} from "@nestjs/common";

import { ConfigService } from '../services/config.service'
import {Collection, MongoClient} from "mongodb";

@Injectable()
export class FactoryRepository {

  private cilent!: MongoClient

  constructor(private configSvc: ConfigService) { }

  async ensureSetup() {

    if (!!this.cilent)
      return

    console.info('Creating MongoDB client')

    this.cilent = new MongoClient(this.configSvc.mongodbUri)

    if (this.configSvc.drop) 
      try {
        console.info(`Dropping database ${this.configSvc.database}`)
        await this.cilent.db(this.configSvc.database).dropDatabase()
      } catch (e) {
        console.error(`Failed to drop database\n`, e)
      }
  }

  collection(colName: string): Collection {
    this.ensureSetup()
    return this.cilent.db(this.configSvc.database).collection(colName)
  }
}
