import {Inject, Injectable, OnModuleInit, LoggerService} from "@nestjs/common";
import {FactoryRepository} from "./factory.repository";
import {Collection, Document} from "mongodb";

import {loadDecks} from "src/utils";

import {Deck} from "src/models/deck";
import {ConfigService} from "src/services/config.service";
import {WINSTON_MODULE_NEST_PROVIDER} from "nest-winston";

const DECK_COLLECTION = 'decks'

@Injectable()
export class DeckRepository implements OnModuleInit {

  private colDecks: Collection

  constructor(private readonly factoryRepo: FactoryRepository
        , private readonly configSvc: ConfigService
        , @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {
    this.colDecks = this.factoryRepo.collection(DECK_COLLECTION)
  }

  getMetadata(): Promise<Document[]>  {
    return this.colDecks.find()
        .project({ _id: 0, metadata: 1 })
        .sort({ 'metadata.name': 1 }).toArray()
  }

  getCode(deckId: string): Promise<string[]> {
    return this.colDecks.aggregate([
      { $match: { 'metadata.id': deckId } },
      { $project: { 'spec.cards': 1, _id: 0 } },
      { $unwind: '$spec.cards' },
      { $project: { code: '$spec.cards.code'} }
    ])
    .toArray()
    .then(codes => codes.map(doc => doc.code))
  }

  getBackImage(deckId: string): Promise<string> {
    return this.colDecks.findOne({ 'metadata.id': deckId })
        .then(result => {
          if (!result)
            return null
          return result.spec.backImage
        })
  }

  getDeckCardByCode(deckId: string, code: string) {
    return this.colDecks.findOne({ 'metadata.id': deckId })
      .then((result: any) => {
        if (!result)
          return null
        return result.spec.cards.filter((c: any) => c.code.toLowerCase() == code.toLowerCase())
      })
  }

  getDeckById(deckId: string): Promise<Document | null> {
    // @ts-ignore
    return this.colDecks.findOne({ 'metadata.id': deckId })
  }

  insertDecks(decks: Deck[]) {
    // @ts-ignore
    return this.colDecks.insertMany(decks)
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
      this.logger.log("Dropping decks from collection", DeckRepository.name)
      await this.dropDecksCollection()
    }
    
    const decks: Deck[] = loadDecks(this.configSvc.decksDir, this.logger)

    try {
      const result = await this.insertDecks(decks)
      this.logger.log(`Added ${Object.keys(result.insertedIds).length} decks`, DeckRepository.name)
      await this.colDecks.createIndex({ 'metadata.id': 1 })
      this.configSvc.ready = (new Date()).getTime()
    } catch (err: any) {
      this.logger.error("Cannot save decks", err, DeckRepository.name)
    }
  }
}
