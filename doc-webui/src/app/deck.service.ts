import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Injectable, inject} from "@angular/core";
import {CreateDeckOptions, DeckBackImage, DeckInfo, DeckStatus} from "./models/models";
import {lastValueFrom} from "rxjs";
import { environment } from 'src/environments/environment'

@Injectable()
export class DeckService {

  private http = inject(HttpClient)
  private readonly BASE

  constructor() {
    this.BASE = environment.base
    console.info(`Using ${this.BASE}`)
  }

  getDecks(): Promise<DeckInfo[]> {
    return lastValueFrom(
      this.http.get<any>(`${this.BASE}/decks`)
    ).then((resp: any) => resp['decks'] as DeckInfo[])
  }

  //createDeck(deckId: string, count = 1): Promise<DeckStatus> {
  createDeck(deckId: string, createOpts: CreateDeckOptions): Promise<DeckStatus> {

    const opts = {
      deck_id: deckId,
      deck_count: createOpts.count,
      replacement: createOpts.replacement,
      shuffle: createOpts.shuffle
    }

    return lastValueFrom(
      this.http.post<DeckStatus>(`${this.BASE}/deck`, opts)
    )
  }

  getDeckStatus(deckId: string): Promise<DeckStatus> {
    return lastValueFrom(
      this.http.get<DeckStatus>(`${this.BASE}/deck/${deckId}/status`)
    )
  }

  drawDeck(deckId: string, count = 1): Promise<DeckStatus> {
    const params = new HttpParams().set('count', count)

    return lastValueFrom(
      this.http.get<DeckStatus>(`${this.BASE}/deck/${deckId}`, { params })
    )
  }

  deleteDeck(deckId: string): Promise<any> {
    return lastValueFrom(
      this.http.delete<any>(`${this.BASE}/deck/${deckId}`)
    )
  }

  getBackImage(deckId: string): Promise<string> {
    const headers = new HttpHeaders()
        .set('Cache-Control', 'no-cache')
    return lastValueFrom(
      this.http.get<DeckBackImage>(`${this.BASE}/deck/${deckId}/back`, { headers })
    ).then(result => result.back_image)
  }
}
