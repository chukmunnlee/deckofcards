import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Injectable, inject} from "@angular/core";
import {DeckBackImage, DeckInfo, DeckStatus} from "./models/models";
import {lastValueFrom} from "rxjs";

const BASE = 'http://localhost:3000/api'
// const BASE = 'https://deckofcards.chuklee.com/api'

@Injectable()
export class DeckService {

  private http = inject(HttpClient)

  getDecks(): Promise<DeckInfo[]> {
    return lastValueFrom(
      this.http.get<any>(`${BASE}/decks`)
    ).then((resp: any) => resp['decks'] as DeckInfo[])
  }

  createDeck(deckId: string, count = 1): Promise<DeckStatus> {

    const opts = {
      deck_id: deckId,
      deck_count: count,
      shuffle: true
    }

    return lastValueFrom(
      this.http.post<DeckStatus>(`${BASE}/deck`, opts)
    )
  }

  getDeckStatus(deckId: string): Promise<DeckStatus> {
    return lastValueFrom(
      this.http.get<DeckStatus>(`${BASE}/deck/${deckId}`)
    )
  }

  drawDeck(deckId: string, count = 1): Promise<DeckStatus> {
    const params = new HttpParams().set('count', count)

    return lastValueFrom(
      this.http.get<DeckStatus>(`${BASE}/deck/${deckId}`, { params })
    )
  }

  deleteDeck(deckId: string): Promise<any> {
    return lastValueFrom(
      this.http.delete<any>(`${BASE}/deck/${deckId}`)
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
