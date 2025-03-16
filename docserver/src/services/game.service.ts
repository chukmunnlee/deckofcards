import {Injectable} from "@nestjs/common";
import {GameRepository} from "src/repositories/game.repository";

@Injectable()
export class GameService {

  constructor(private gameRepo: GameRepository) { }

  getRunningGames() {
    return this.gameRepo.getGameIds()
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
