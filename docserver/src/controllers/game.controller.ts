import {Controller, Get, HttpException, HttpStatus, Param} from "@nestjs/common";
import {GameService} from "src/services/game.service";

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
}
