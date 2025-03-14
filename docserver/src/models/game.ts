import {Card, DeckPresets} from "./deck"

export interface Pile {
  name: string
  cards: Card[]
  labels?: {
    [ key: string ]: number | boolean | string
  }
}

export interface Game {
  gameId: string
  deckId: string
  presets: DeckPresets
  createdOn: number
  lastUpdate: number
  piles: {
    [ pileName: string ]: Pile
  }
}
