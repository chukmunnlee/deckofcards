import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Injectable, inject} from "@angular/core";
import {DeckBackImage, DeckInfo, DeckStatus} from "./models/models";
import {lastValueFrom} from "rxjs";

const BASE = 'http://localhost:3000/api'

@Injectable()
export class DeckService {

  private http = inject(HttpClient)

  getDecks(): Promise<DeckInfo[]> {
    return lastValueFrom(
      this.http.get<DeckInfo[]>(`${BASE}/decks`)
    )
  }

  createDeck(deckId: string, count = 1): Promise<DeckStatus> {
    const params = new HttpParams()
        .set('deck_id', deckId).set('deck_count', count)

    return lastValueFrom(
      this.http.get<any>(`${BASE}/deck/new`, { params })
    )
  }

  getBackImage(deckId: string): Promise<string> {
    const headers = new HttpHeaders()
        .set('Cache-Control', 'no-cache')
    return lastValueFrom(
      this.http.get<DeckBackImage>(`${BASE}/deck/${deckId}/back`, { headers })
    ).then(result => result.back_image)
  }
}
