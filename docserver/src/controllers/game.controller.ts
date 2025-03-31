import {Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Query} from "@nestjs/common";
import {Card} from "src/models/deck";
import {PatchGame} from "src/models/messages";
import {GameService} from "src/services/game.service";

// drawFromDeck, dropToDeck, moveFromDeck
const DRAW_FROM_DECK = 'draw'
const DROP_TO_DECK = 'drop'
const MOVE_FROM_DECK = 'move'

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

  @Get('/game/:gameId/pile')
  getGamePileById(@Param('gameId') gameId: string, @Query('count') count = 1) {
    return this.gameSvc.getGameByIdPile(gameId, 'pile_0', count)
  }

  @Get('/game/:gameId/pile/:pileName')
  getGamePileByName(@Param('gameId') gameId: string, @Param('pileName') pileName: string,
      @Query('count') count = 1) {
    return this.gameSvc.getGameByIdPile(gameId, pileName, count)
  }

  @Post('/game/:gameId')
  postGameById(@Param('gameId') gameId: string) {
    return this.gameSvc.restartGameById(gameId)
      .then(game => {
        if (!game)
          throw new HttpException(`Cannot restart game from ${gameId}. Not found`
              , HttpStatus.NOT_FOUND)
        return { gameId: game.gameId }
      })
  }

  @Patch('/game/:gameId')
  async patchGameById(@Param('gameId') gameId: string, @Body() payload: PatchGame) {

    let drawn: Card[] = []

    switch (payload.action) {
      case DRAW_FROM_DECK:
        drawn = await this.gameSvc.drawFromDeck(gameId, payload)
        break

      case DROP_TO_DECK:
        break

      case MOVE_FROM_DECK:
        break

      default:
        throw new HttpException(`Illegal patch action: ${payload.action}`
            , HttpStatus.BAD_REQUEST)
    }

    return { gameId, cards: drawn }
  }

  @Delete('/game/:gameId')
  @HttpCode(HttpStatus.OK)
  async deleteGameById(@Param('gameId') gameId: string) {
    return this.gameSvc.deleteGameById(gameId)
        .then(() => ({}))
  }
}
