import {Controller, Get, HttpException, HttpStatus, Param} from "@nestjs/common";
import {DeckPresets} from "src/models/deck";
import {DeckService} from "src/services/deck.service";

@Controller()
export class DeckController {

  constructor(private deckSvc: DeckService) { }

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
}
