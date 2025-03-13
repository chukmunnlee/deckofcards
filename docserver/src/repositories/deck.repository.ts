import {Injectable, OnModuleInit} from "@nestjs/common";
import {FactoryRepository} from "./factory.repository";
import {Collection, Document} from "mongodb";

import {loadDecks} from "src/utils";

import {Deck} from "src/models/deck";
import {ConfigService} from "src/services/config.service";
import {Metadata} from "src/models/resource";

const DECK_COLLECTION = 'decks'

@Injectable()
export class DeckRepository implements OnModuleInit {


  private colDecks: Collection

  constructor(private factoryRepo: FactoryRepository
        , private configSvc: ConfigService) {
    this.colDecks = this.factoryRepo.collection(DECK_COLLECTION)
  }

  insertDecks(decks: Deck[]) {
    // @ts-ignore
    return this.colDecks.insertMany(decks)
  }

  //getMetadata(): Promise<Metadata[]> {
  getMetadata(): Promise<Document[]>  {
    return this.colDecks.find()
        .project({ _id: 0, metadata: 1 })
        .sort({ 'metadata.name': 1 }).toArray()
  }

  getDeckById(deckId: string): Promise<Document | null> {
    // @ts-ignore
    return this.colDecks.findOne({ 'metadata.id': deckId })
  }

  async onModuleInit() {

    if (!this.configSvc.decksDir) {
      this.configSvc.ready = (new Date()).getTime()
      return
    }
    
    const decks: Deck[] = loadDecks(this.configSvc.decksDir)

    try {
      await this.insertDecks(decks)
      await this.colDecks.createIndex({'metadata.id': 1 })
      this.configSvc.ready = (new Date()).getTime()
    } catch (err: any) {
      console.error('Cannot save decks\n', err)
    }
  }
}
