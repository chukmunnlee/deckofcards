import {Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post, UseInterceptors} from "@nestjs/common";
import {TelemetryInterceptor} from "src/middlewares/telemetry.interceptor";
import {DeckPresets} from "src/models/deck";
import {DeckService} from "src/services/deck.service";

@Controller()
@UseInterceptors(TelemetryInterceptor)
export class DeckController {

  constructor(private readonly deckSvc: DeckService) { }

  @Get('/decks')
  getDecks() {
    return this.deckSvc.getDeckMetadata()
  }

  @Get('/deck/:deckId/presets')
  async getDeckPresets(@Param('deckId') deckId: string): Promise<DeckPresets> {
    return this.deckSvc.getDeckPresetsById(deckId)
        .then(presets => {
          if (!presets)
            throw new HttpException(`Deck id ${deckId} not found`, HttpStatus.NOT_FOUND)
          return presets
        })
  }

  @Post('/deck/:deckId')
  @HttpCode(HttpStatus.CREATED)
  async postDeck(@Param('deckId') deckId: string, @Body() payload: DeckPresets) {
    const game = await this.deckSvc.createGameFromId(deckId, payload)
    if (!game)
      throw new HttpException(`Cannot create game from ${deckId}. Not found`
          , HttpStatus.NOT_FOUND)
    return { gameId: game.gameId }
  }
}
