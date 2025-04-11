import {Injectable} from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid'
import { Deck, DeckPresets} from "src/models/deck";
import { Game } from "src/models/game";
import {Metadata} from "src/models/resource";
import {DeckRepository} from "src/repositories/deck.repository";
import { createPlayingDeck} from "src/utils";
import {GameRepository} from "src/repositories/game.repository";
import {ConfigService} from "./config.service";

@Injectable()
export class DeckService {

  constructor(private readonly deckRepo: DeckRepository
      , private readonly gameRepo: GameRepository, private configSvc: ConfigService) { }

  getDeckMetadata(): Promise<Metadata[]> {
    return this.deckRepo.getMetadata()
        .then(result => 
          result.map(r => {
            return { ...r.metadata } as Metadata
          })
        )
  }

  getCodes(deckId: string): Promise<string[]> {
    return this.deckRepo.getCode(deckId)
  }

  getBackImage(deckId: string): Promise<string> {
    return this.deckRepo.getBackImage(deckId)
  }

  getDeckCardByCode(deckId: string, code: string) {
    return this.deckRepo.getDeckCardByCode(deckId, code)
        .then(result => {
          if ((null == result) || (result.length <= 0))
            return null
          return result[0]
        })
  }

  getDeckPresetsById(deckId: string) {
    return this.deckRepo.getDeckById(deckId)
        .then(result => {
          if (!result)
            return null
          return { ...result.spec.presets } as DeckPresets
        })
  }

  getDeckById(deckId: string) {
    return this.deckRepo.getDeckById(deckId)
  }

  async createGameFromId(deckId: string, payload: DeckPresets) {

    this.gameRepo.cleanInativeGame(this.configSvc.inactive)

    const deck: Deck = await this.deckRepo.getDeckById(deckId) as Deck;

    if (!deck)
      return null

    const currTime = Date.now()

    const game: Game = {
      gameId: uuidv4().substring(0, 8),
      deckId: deck.metadata.id,
      presets: { ...deck.spec.presets, ...payload },
      piles: {},
      createdOn: currTime, 
      lastUpdate: currTime,
    }

    const newGame = createPlayingDeck(game, deck.spec.cards)

    await this.gameRepo.insertGame(newGame)

    return newGame
  }
}
