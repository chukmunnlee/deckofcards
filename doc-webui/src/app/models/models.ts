export interface DeckInfo {
  id: string
  name: string
  description: string
}

export interface Card {
  code: string
  count: number
  image: string
  images: {
    svg: string
    png: string
  }
  value: string
  suit: string
}

export interface DeckStatus {
  deck_id: string
  remaining: number
  shuffled: boolean
  success: boolean
  cards?: Card[]
}

export interface DeckBackImage {
  back_image: string
}

export interface CreateDeckOptions {
  deckCount: number
  replacement: boolean
  shuffle: boolean
}
