import {Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Put, Query, UseInterceptors} from "@nestjs/common";
import {TelemetryInterceptor} from "src/middlewares/telemetry.interceptor";
import {Card} from "src/models/deck";
import {DeleteCardsFromPile, PatchCardsToPile, PutGame} from "src/models/messages";
import {ConfigService} from "src/services/config.service";
import {GameService} from "src/services/game.service";

@Controller()
@UseInterceptors(TelemetryInterceptor)
export class GameController {

  constructor(private readonly gameSvc: GameService, private readonly configSvc: ConfigService) { }

  @Get('/games')
  getGames() {
    return this.gameSvc.getRunningGames(this.configSvc.inactive)
  }
  //
  //@Get('/game/:gameId/status')
  @Get('/game/:gameId')
  getGameStatusById(@Param('gameId') gameId: string) {
    return this.gameSvc.getStatusById(gameId)
        .catch(err => new HttpException(err, HttpStatus.NOT_FOUND))
  }

  @Post('/game/:gameId')
  @HttpCode(HttpStatus.CREATED)
  postGameById(@Param('gameId') gameId: string) {
    return this.gameSvc.restartGameById(gameId)
      .then(game => {
        if (!game)
          throw new HttpException(`Cannot restart game from ${gameId}. Not found`
              , HttpStatus.NOT_FOUND)
        return { gameId: game.gameId }
      })
  }

  @Delete('/game/:gameId')
  @HttpCode(HttpStatus.OK)
  async deleteGameById(@Param('gameId') gameId: string) {
    return this.gameSvc.deleteGameById(gameId)
        .then(() => ({}))
  }

  @Get('/game/:gameId/pile')
  getGamePileById(@Param('gameId') gameId: string, @Query('count') count = 1) {
    return this.gameSvc.getGameByIdPile(gameId, 'pile_0', count)
  }

  @Put('/game/:gameId/pile')
  async putGameById(@Param('gameId') gameId: string, @Body() payload: PutGame) {

    let cards: Card[] = []
    cards = await this.gameSvc.drawFromDeck(gameId, payload)

    return { gameId, cards }
  }

  @Delete('/game/:gameId/pile')
  async deleteCards(@Param('gameId') gameId: string, @Body() payload: DeleteCardsFromPile) {
    let cards = await this.gameSvc.removeFromPile(gameId, payload)

    return { gameId, cards }
  }

  @Patch('/game/:gameId/pile')
  async patchCards(@Param('gameId') gameId: string, @Body() payload: PatchCardsToPile) {
    let cards = await this.gameSvc.patchToPile(gameId, payload)

    return { gameId, cards }
  }

  @Get('/game/:gameId/pile/:pileName')
  getGamePileByName(@Param('gameId') gameId: string, @Param('pileName') pileName: string,
      @Query('count') count = 1) {
    return this.gameSvc.getGameByIdPile(gameId, pileName, count)
  }

}
