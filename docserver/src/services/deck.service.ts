import {Injectable} from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid'
import {Card, Deck, DeckPresets} from "src/models/deck";
import {Game, Pile} from "src/models/game";
import {Metadata} from "src/models/resource";
import {DeckRepository} from "src/repositories/deck.repository";

@Injectable()
export class DeckService {

  constructor(private readonly deckRepo: DeckRepository) { }

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

    const deck: Deck = await this.deckRepo.getDeckById(deckId) as Deck;

    if (!deck)
      return null

    const game: Game = {
      gameId: uuidv4().substring(0, 8),
      deckId: deck.metadata.id,
      presets: { ...deck.spec.presets, ...payload },
      piles: {},
      createdOn: 0,
      lastUpdate: 0
    }

    const newGame = this.createPlayingDeck(game, deck.spec.cards)

    return newGame
  }

  private createPlayingDeck(game: Game, cards: Card[]) {

    let _cards: Card[] = []
    const _game: Game = { ...game }

    // Create the number of decks
    // @ts-ignore
    for (let i = 0; i < game.presets?.count; i++)
      _cards = [ ..._cards, ...cards ]

    if (game.presets?.shuffle) 
      for (let i = 0; i < _cards.length; i++) {
        const j = Math.floor(Math.random() * (i + 1)); 
        [_cards[i], _cards[j]] = [_cards[j], _cards[i]];
      }

    // @ts-ignore
    const pileCount = _cards.length / game.presets.split | 0
    //
    // @ts-ignore
    for (let i = 0; i < game.presets.split; i++) {
      const name = `pile_${i}`
      const startIdx = pileCount * i
      const endIdx = startIdx + pileCount
      _game.piles[name] = {
        name,
        cards: _cards.slice(startIdx, endIdx)
      } as Pile
    }

    _game.createdOn = (new Date()).getTime()
    _game.lastUpdate = _game.createdOn

    return _game
  }

}
