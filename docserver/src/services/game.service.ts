import {BadRequestException, Injectable, NotAcceptableException, NotFoundException, PreconditionFailedException} from "@nestjs/common";
import {Card, Deck} from "src/models/deck";
import {Game, Pile} from "src/models/game";
import {PatchGame} from "src/models/messages";
import {DeckRepository} from "src/repositories/deck.repository";
import {GameRepository} from "src/repositories/game.repository";
import {drawFromBotton, drawFromTop, drawRandomly, dropRandomly, dropToBottom, dropToTop, createPlayingDeck} from "src/utils";


const DRAW_FROM_DECK_PATCH_DEFAULTS: Partial<PatchGame> = {
  fromPile: 'pile_0', drawFrom: 'top', 
  //toPile: 'drawn', dropTo: 'top',
  count: 1,
}

@Injectable()
export class GameService {

  constructor(private gameRepo: GameRepository, private deckRepo: DeckRepository) { }

  getRunningGames() {
    return this.gameRepo.getGameIds()
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

    const newGame = createPlayingDeck(_game, deck.spec.cards)

    await this.gameRepo.replaceGameById(newGame)

    return newGame

  }

  async getGameByIdPile(gameId: string, pileName = 'pile_0', count = 1) {
    // @ts-ignore
    const game: Game = await this.gameRepo.getGameById(gameId) 
    if (!game)
      throw new NotFoundException(`Cannot find game ${gameId}`)

    if (!game.piles[pileName])
      return []

    return game.piles[pileName].cards.slice(0, count)
  }

  async drawFromDeck(gameId: string, patch: PatchGame) {
    // @ts-ignore
    const game: Game = await this.gameRepo.getGameById(gameId) 
    if (!game)
      throw new NotFoundException(`Cannot find game ${gameId}`)

    const lastUpdate = game.lastUpdate

    const _patch: PatchGame = {
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
        throw new NotAcceptableException(`select draw semantics has not been implemented`)

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

        case 'select':
          throw new NotAcceptableException(`select draw semantics has not been implemented`)

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
      throw new PreconditionFailedException(`GameId ${game.gameId} has been modified during the ${_patch.action}`)

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
