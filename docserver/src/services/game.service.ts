import {BadRequestException, Injectable, InternalServerErrorException, NotAcceptableException, NotFoundException, PreconditionFailedException} from "@nestjs/common";
import {Card, Deck} from "src/models/deck";
import {Game, Pile} from "src/models/game";
import {DeleteCardsFromPile, PatchCardsToPile, PutGame} from "src/models/messages";
import {DeckRepository} from "src/repositories/deck.repository";
import {GameRepository} from "src/repositories/game.repository";
import {drawFromBotton, drawFromTop, drawRandomly, dropRandomly, dropToBottom, dropToTop, createPlayingDeck, drawSpecific, selectCards, shuffleDeck} from "src/utils/utils";


const DRAW_FROM_DECK_PATCH_DEFAULTS: Partial<PutGame> = {
  fromPile: 'pile_0', drawFrom: 'top', 
  toPile: 'discarded', dropTo: 'top',
  count: 1,
}

const DEFAULT_DELETE_CARDS_FROM_PILE: DeleteCardsFromPile = {
  count: 1, 
  fromPile: 'pile_0', drawFrom: 'top',
  cards: []
}

const DEFAULT_PATCH_CARDS_TO_PILE: PatchCardsToPile = {
  toPile: 'pile_0', dropTo: 'top',
  cards: [], // code
  shuffle: false
}

@Injectable()
export class GameService {

  constructor(private gameRepo: GameRepository, private deckRepo: DeckRepository) { }

  getRunningGames(duration: number) {
    return this.gameRepo.getGameIds(duration)
  }

  deleteGameById(gameId: string) {
    return this.gameRepo.deleteGameById(gameId)
  }

  async restartGameById(gameId: string) {

    // @ts-ignore
    const game: Game = await this.gameRepo.getGameById(gameId)
    if (!game)
      return null

    const presets = game.presets
    const deckId = game.deckId
    const currTime = Date.now()

    // @ts-ignore
    const deck: Deck = await this.deckRepo.getDeckById(deckId)

    const _game = {
      gameId, deckId, presets,
      piles: {},
      createdOn: currTime, 
      lastUpdate: currTime,
    }

    let cards: Card[] = deck.spec.cards
    if (!!presets.cards && (presets.cards.length > 0))
      cards = selectCards(deck.spec.cards, presets.cards)

    const newGame = createPlayingDeck(_game, cards)

    await this.gameRepo.replaceGameById(newGame)

    return newGame
  }

  async getGameByIdPile(gameId: string, pileName = 'pile_0', count = 1, drawFrom = 'top') {
    // @ts-ignore
    const game: Game = await this.gameRepo.getGameById(gameId) 

    if (!game)
      throw new NotFoundException(`Cannot find game ${gameId}`)

    if (!game.piles[pileName])
      return []

    if (drawFrom == 'bottom') {
      const startPos = Math.max(0, game.piles[pileName].cards.length - count)
      return game.piles[pileName].cards.slice(startPos, startPos + count)
    }

    return game.piles[pileName].cards.slice(0, count)
  }

  async removeFromPile(gameId: string, payload: DeleteCardsFromPile) {
    // @ts-ignore
    const game: Game = await this.gameRepo.getGameById(gameId) 
    if (!game)
      throw new NotFoundException(`Cannot find game ${gameId}`)

    const _payload: DeleteCardsFromPile = {
      ...DEFAULT_DELETE_CARDS_FROM_PILE,
      ...payload
    }

    // @ts-ignore
    if (!game.piles[_payload.fromPile])
      throw new NotFoundException(`Pile ${payload.fromPile} does not exist`)

    // @ts-ignore
    const fromPile = game.piles[_payload.fromPile]
    const lastUpdate = game.lastUpdate
    if (!!_payload.cards && (_payload.cards.length > 0))
      _payload.drawFrom = 'select'

    let drawn: Card[] = []
    let remainder: Card[] = []
    
    // top, botton, random, select
    switch (_payload.drawFrom) {

      case 'bottom':
        ({ drawn, remainder } = drawFromBotton(fromPile.cards, _payload.count))
        break

      case 'random':
        ({ drawn, remainder } = drawRandomly(fromPile.cards, _payload.count))
        break

      case 'select':
        ({ drawn, remainder } = drawSpecific(fromPile.cards, _payload.cards))
        break

      case 'top':
      default:
        ({ drawn, remainder } = drawFromTop(fromPile.cards, _payload.count))
        break
    }

    // @ts-ignore
    game.piles[_payload.fromPile].cards = remainder

    const updated = await this.gameRepo.updateGameById(game, lastUpdate)
    if (!updated)
      throw new PreconditionFailedException(`GameId ${game.gameId} has been modified during the draw`)

    return drawn
  }

  async patchToPile(gameId: string, payload: PatchCardsToPile) {
    // @ts-ignore
    const game: Game = await this.gameRepo.getGameById(gameId) 
    if (!game)
      throw new NotFoundException(`Cannot find game ${gameId}`)

    // @ts-ignore
    const deck: Deck = await this.deckRepo.getDeckById(game.deckId)
    if (!deck)
      throw new InternalServerErrorException(`Cannot find deck ${game.deckId} for game ${game.gameId}`)

    const _payload: PatchCardsToPile = {
      ...DEFAULT_PATCH_CARDS_TO_PILE,
      ...payload
    }
    
    // @ts-ignore
    if (!game.piles[_payload.toPile])
      // @ts-ignore
      game.piles[_payload.toPile] = { 
        name: _payload.toPile, cards: []
      }

    // @ts-ignore
    const toPile = game.piles[_payload.toPile]
    const lastUpdate = game.lastUpdate
    let remainder: Card[] = []

    let selected: Card[] = selectCards(deck.spec.cards, payload.cards ?? [])

    switch (_payload.dropTo) {
      case 'bottom':
        remainder = dropToBottom(toPile.cards, selected)
        break

      case 'random':
        remainder = dropRandomly(toPile.cards, selected)
        break

      case 'top':
      default:
        remainder = dropToTop(toPile.cards, selected)
    }

    if (_payload.shuffle) 
      shuffleDeck(remainder)

    toPile.cards = remainder
    // @ts-ignore
    game.piles[_payload.toPile] = toPile

    const updated = await this.gameRepo.updateGameById(game, lastUpdate)
    if (!updated)
      throw new PreconditionFailedException(`GameId ${game.gameId} has been modified during the draw`)

    return selected
  }

  async drawFromDeck(gameId: string, patch: PutGame) {
    // @ts-ignore
    const game: Game = await this.gameRepo.getGameById(gameId) 
    if (!game)
      throw new NotFoundException(`Cannot find game ${gameId}`)

    const lastUpdate = game.lastUpdate

    const _patch: PutGame = {
      ...DRAW_FROM_DECK_PATCH_DEFAULTS,
      ...patch
    }

    // @ts-ignore
    const fromPile = game.piles[_patch.fromPile]

    if (!fromPile)
      throw new BadRequestException(`Missing fromPile ${fromPile}`)

    let drawn: Card[] = []
    let remainder: Card[] = []

    // top, botton, random, select
    switch (_patch.drawFrom) {

      case 'bottom':
        ({ drawn, remainder } = drawFromBotton(fromPile.cards, _patch.count))
        break

      case 'random':
        ({ drawn, remainder } = drawRandomly(fromPile.cards, _patch.count))
        break

      case 'select':
        ({ drawn, remainder } = drawSpecific(fromPile.cards, _patch.cards))
        break

      case 'top':
      default:
        ({ drawn, remainder } = drawFromTop(fromPile.cards, _patch.count))
        break
    }

    // Update fromPile
    // @ts-ignore
    game.piles[_patch.fromPile].cards = remainder
    game.piles['drawn'].cards.push(...drawn)

    if (!!_patch.toPile) {
      // @ts-ignore
      let toPile: Pile = game.piles[_patch.toPile] ?? { name: _patch.toPile, cards: [] }
      switch (_patch.dropTo) {
        case 'bottom':
          remainder  = dropToBottom(toPile.cards, drawn)
          break

        case 'random':
          remainder  = dropRandomly(toPile.cards, drawn)
          break

        case 'top':
        default:
          remainder  = dropToTop(toPile.cards, drawn)
          break
        }
      toPile.cards = remainder

      game.piles[_patch.toPile] = toPile
    }

    const updated = await this.gameRepo.updateGameById(game, lastUpdate)
    if (!updated)
      throw new PreconditionFailedException(`GameId ${game.gameId} has been modified during the draw`)

    return drawn
  }

  getStatusById(gameId: string) {
    return this.gameRepo.getGameById(gameId)
        .then(result => {
          if (!result)
            throw `Cannot find gameId ${gameId}`

          // @ts-ignore
          return this.gameStatus(result as Game)
        })
  }

  private gameStatus(game: Game) {
      const status = { 
        gameId: game.gameId,
        deckId: game.deckId,
        createdOn: game.createdOn,
        lastUpdate: game.lastUpdate,
        piles: {}
      }
      for (let k in game.piles)
        status.piles[k] = game.piles[k].cards.length

      return status
  }
}
