import {Injectable} from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid'
import {Card, Deck, DeckPresets} from "src/models/deck";
import {Game, Pile} from "src/models/game";
import {Metadata} from "src/models/resource";
import {DeckRepository} from "src/repositories/deck.repository";
import {shuffleDeck} from "src/utils";
import {GameRepository} from "src/repositories/game.repository";
import {ConfigService} from "./config.service";

@Injectable()
export class DeckService {

  readonly inactiveDuration: number

  constructor(private readonly deckRepo: DeckRepository
      , private readonly gameRepo: GameRepository, private configSvc: ConfigService) { 
    this.inactiveDuration = this.configSvc.inactive
  }

  getDeckMetadata(): Promise<Metadata[]> {
    return this.deckRepo.getMetadata()
        .then(result => 
          result.map(r => {
            return { ...r.metadata } as Metadata
          })
        )
  }

  getDeckPresetsById(deckId: string) {
    return this.deckRepo.getDeckById(deckId)
        .then(result => {
          if (!result)
            return null
          return { ...result.spec.presets } as DeckPresets
        })
  }

  async createGameFromId(deckId: string, payload: DeckPresets) {

    this.gameRepo.cleanInativeGame(this.inactiveDuration)

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

    const newGame = this.createPlayingDeck(game, deck.spec.cards)

    await this.gameRepo.insertGame(game)

    return newGame
  }

  private createPlayingDeck(game: Game, cards: Card[]) {

    const _game: Game = { ...game }

    if (_game.presets.atomic) 
      this.createAtomicGameDeck(_game, cards)

    else 
      this.createGameDeck(_game, cards)

    _game.piles['discard'] = { name: 'discard', cards: [] }

    return _game
  }

  private createGameDeck(game: Game, cards: Card[]) {
    let _cards: Card[] = []
    // Create the number of decks
    // @ts-ignore
    for (let i = 0; i < game.presets?.count; i++)
      _cards = [ ..._cards, ...cards ]

    if (game.presets?.shuffle) 
      shuffleDeck(_cards)

    // @ts-ignore
    let pileCount = _cards.length / game.presets.split | 0
    
    // @ts-ignore
    for (let i = 0; i < game.presets.split; i++) {
      const name = `pile_${i}`
      const startIdx = pileCount * i
      const endIdx = startIdx + pileCount
      game.piles[name] = {
        name,
        cards: _cards.slice(startIdx, endIdx)
      } as Pile
    }

    return game
  }

  private createAtomicGameDeck(game: Game, cards: Card[]) {
    // @ts-ignore
    for (let i = 0; i < game.presets.count; i++) {
      const name = `pile_${i}`
      const _cards = [ ...cards ]
      if (game.presets.shuffle)
        shuffleDeck(_cards)
      game.piles[name] = { name, cards: _cards }
    }
    return game
  }
}
