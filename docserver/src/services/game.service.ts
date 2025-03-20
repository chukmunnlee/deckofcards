import {Injectable} from "@nestjs/common";
import {Game} from "src/models/game";
import {PatchGame} from "src/models/messages";
import {GameRepository} from "src/repositories/game.repository";

const DRAW_FROM_DECK_PATCH_DEFAULTS: PatchGame = {
  fromPile: 'pile_0', drawFrom: 'top', 
  toPile: 'drawn', dropTo: 'top',
  count: 1,
}

@Injectable()
export class GameService {

  constructor(private gameRepo: GameRepository) { }

  getRunningGames() {
    return this.gameRepo.getGameIds()
  }

  async drawFromDeck(gameId: string, patch: PatchGame) {
    // @ts-ignore
    const game: Game = await this.gameRepo.getGameById(gameId) 
    if (!game)
      return null

    const _patch: PatchGame = {
      ...DRAW_FROM_DECK_PATCH_DEFAULTS,
      ...patch
    }

    // @ts-ignore
    const fromPile = game.piles[_patch.fromPile]
    // @ts-ignore
    const toPile = game.piles[_patch.toPile]

    if (!(fromPile && toPile))
      return null

    switch (_patch.drawFrom) {
    }
  }

  getStatusById(gameId: string) {
    return this.gameRepo.getGameById(gameId)
        .then(result => {
          if (!result)
            throw `Cannot find gameId ${gameId}`

          const status = { 
            gameId: result.gameId,
            deckId: result.deckId,
            createdOn: result.createdOn,
            lastUpdate: result.lastUpdate,
            decks: {}
          }
          for (let k in result.piles)
            status[k] = result.piles[k].cards.length
          return status
        })
  }
}
