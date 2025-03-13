import {Injectable} from "@nestjs/common";
import {DeckPresets} from "src/models/deck";
import {Metadata} from "src/models/resource";
import {DeckRepository} from "src/repositories/deck.repository";

@Injectable()
export class DeckService {

  constructor(private deckRepo: DeckRepository) { }

  getDeckMetadata(): Promise<Metadata[]> {
    return this.deckRepo.getMetadata()
        .then(result => 
          result.map(r => {
            return { ...r.metadata } as Metadata
          })
        )
  }

  getDeckPresetsById(deckId: string) {
    return this.deckRepo.getDeckById(deckId)
        .then(result => {
          if (!result)
            return null
          return { ...result.spec.presets } as DeckPresets
        })
  }

}
