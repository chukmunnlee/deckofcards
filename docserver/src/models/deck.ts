import { Resource } from './resource'

export interface Card {
  code: string
  image: string
  images: { [ key: string ]: string }[]
  suit: string
  value: string
  count?: number
}

export interface DeckSpec {
  backImage: string
  presets?: DeckPresets
  cards: Card[]
}

export interface DeckPresets {
  count?: number
  split?: number
  atomic: boolean
  shuffle?: boolean
  replacement?: boolean
  select?: string[]
  [ feature: string ]: any
}

export interface Deck extends Resource {
  spec: DeckSpec
}
