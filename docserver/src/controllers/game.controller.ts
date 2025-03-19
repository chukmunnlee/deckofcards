import {Body, Controller, Get, HttpException, HttpStatus, Param, Patch} from "@nestjs/common";
import {PatchGame} from "src/models/messages";
import {GameService} from "src/services/game.service";

// drawFromDeck, dropToDeck, moveFromDeck
const DRAW_FROM_DECK = 'drawFromDeck'
const DROP_TO_DECK = 'dropToDeck'
const MOVE_FROM_DECK = "moveFromDeck'

@Controller()
export class GameController {

  constructor(private gameSvc: GameService) { }

  @Get('/games')
  getGames() {
    return this.gameSvc.getRunningGames()
  }

  @Get('/game/:gameId/status')
  getGameStatusById(@Param('gameId') gameId: string) {
    return this.gameSvc.getStatusById(gameId)
        .catch(err => new HttpException(err, HttpStatus.NOT_FOUND))
  }

  @Patch('/game/:gameId')
  patchGameById(@Param('gameId') gameId: string, @Body() payload: PatchGame) {

    switch (payload.action) {
      case DRAW_FROM_DECK:
        break

      case DROP_TO_DECK:
        break

      case MOVE_FROM_DECK:
        break

      default:
        throw new HttpException(`Illegal patch action: ${payload.action}`
            , HttpStatus.BAD_REQUEST)
    }

    return { gameId }
  }
}
