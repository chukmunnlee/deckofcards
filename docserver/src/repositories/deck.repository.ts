import {Injectable, OnModuleInit} from "@nestjs/common";
import {FactoryRepository} from "./factory.repository";
import {Collection} from "mongodb";

import {loadDecks} from "src/utils";

import {Deck} from "src/models/deck";
import {ConfigService} from "src/services/config.service";

const DECK_COLLECTION = 'decks'

@Injectable()
export class DeckRepository implements OnModuleInit {


  private colDecks: Collection

  constructor(private factoryRepo: FactoryRepository
        , private configSvc: ConfigService) {
    this.colDecks = this.factoryRepo.collection(DECK_COLLECTION)
  }

  insertDecks(decks: Deck[]) {
    const _decks = decks.map(
      d => ({
        ...d, _id: d.metadata.id
      })
    )
    // @ts-ignore
    return this.colDecks.insertMany(_decks)
  }

  async onModuleInit() {

    if (!this.configSvc.decksDir)
      return
    
    const decks: Deck[] = loadDecks(this.configSvc.decksDir)

    try {
      await this.insertDecks(decks)
    } catch (err: any) {
      console.error('Cannot save decks\n', err)
    }
  }
}
