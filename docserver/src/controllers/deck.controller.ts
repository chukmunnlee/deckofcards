import {Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post, UseInterceptors} from "@nestjs/common";
import {TelemetryInterceptor} from "src/middlewares/telemetry.interceptor";
import {DeckPresets} from "src/models/deck";
import {DeckService} from "src/services/deck.service";
import {TelemetryService} from "src/services/telemetry.service";

@Controller()
@UseInterceptors(TelemetryInterceptor)
export class DeckController {

  constructor(private readonly deckSvc: DeckService
      , private readonly telemetrySvc: TelemetryService) { }

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

  @Get('/deck/:deckId/codes')
  getDeckCodes(@Param('deckId') deckId: string) {
    return this.deckSvc.getCodes(deckId)
        .then(codes => {
          if (!codes.length)
            throw new HttpException(`Deck id ${deckId} not found`, HttpStatus.NOT_FOUND)
          return codes
        })
  }

  @Get('/deck/:deckId/card/:code')
  getDeckCardByCode(@Param('deckId') deckId: string, @Param('code') code: string) {
    return this.deckSvc.getDeckCardByCode(deckId, code)
        .then(result => {
          if (!result)
            throw new HttpException(`Deck id ${deckId} or card code ${code} not found`, HttpStatus.NOT_FOUND)
          return result
        })
  }

  @Get('/deck/:deckId/back')
  getDeckBack(@Param('deckId') deckId: string) {
    return this.deckSvc.getBackImage(deckId)
        .then(backImage => {
          if (!backImage)
            throw new HttpException(`Deck id ${deckId} not found`, HttpStatus.NOT_FOUND)
          return { backImage }
        })
  }

  @Get('/deck/:deckId')
  getDeck(@Param('deckId') deckId: string) {
    return this.deckSvc.getDeckById(deckId)
        .then(deck => {
          if (!deck)
            throw new HttpException(`Deck id ${deckId} not found`, HttpStatus.NOT_FOUND)
          return deck
        })
  }

  @Post('/deck/:deckId')
  @HttpCode(HttpStatus.CREATED)
  async postDeck(@Param('deckId') deckId: string, @Body() payload: DeckPresets) {
    const game = await this.deckSvc.createGameFromId(deckId, payload ?? {})
    if (!game)
      throw new HttpException(`Cannot create game from ${deckId}. Not found`
          , HttpStatus.NOT_FOUND)
    this.telemetrySvc.gameTotal.add(1)
    return { gameId: game.gameId }
  }
}
