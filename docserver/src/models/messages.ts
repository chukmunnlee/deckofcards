import {Card} from "./deck"

export interface PatchGame {
  // drawFromDeck, dropToDeck, moveFromDeck
  action: string 
  // top, botton, random
  drawFrom?: string
  dropTo?: string
  count?: number
  fromPile?: string
  toPile?: string
  cards?: Card[]
}

