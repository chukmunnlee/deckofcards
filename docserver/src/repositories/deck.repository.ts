import {Injectable, OnModuleInit} from "@nestjs/common";
import {FactoryRepository} from "./factory.repository";
import {Collection, Document} from "mongodb";

import {loadDecks} from "src/utils";

import {Deck} from "src/models/deck";
import {ConfigService} from "src/services/config.service";

const DECK_COLLECTION = 'decks'

@Injectable()
export class DeckRepository implements OnModuleInit {


  private colDecks: Collection

  constructor(private readonly factoryRepo: FactoryRepository
        , private readonly configSvc: ConfigService) {
    this.colDecks = this.factoryRepo.collection(DECK_COLLECTION)
  }

  insertDecks(decks: Deck[]) {
    // @ts-ignore
    return this.colDecks.insertMany(decks)
  }

  getMetadata(): Promise<Document[]>  {
    return this.colDecks.find()
        .project({ _id: 0, metadata: 1 })
        .sort({ 'metadata.name': 1 }).toArray()
  }

  getDeckById(deckId: string): Promise<Document | null> {
    // @ts-ignore
    return this.colDecks.findOne({ 'metadata.id': deckId })
  }

  dropDecksCollection() {
    return this.colDecks.drop()
  }

  async onModuleInit() {

    if (!this.configSvc.decksDir) {
      this.configSvc.ready = (new Date()).getTime()
      return
    }

    if (this.configSvc.drop) {
      console.info('Dropping decks collection')
      await this.dropDecksCollection()
    }
    
    const decks: Deck[] = loadDecks(this.configSvc.decksDir)

    try {
      const result = await this.insertDecks(decks)
      console.info(`Added ${Object.keys(result.insertedIds).length} decks`)
      await this.colDecks.createIndex({ 'metadata.id': 1 })
      this.configSvc.ready = (new Date()).getTime()
    } catch (err: any) {
      console.error('Cannot save decks\n', err)
    }
  }
}
