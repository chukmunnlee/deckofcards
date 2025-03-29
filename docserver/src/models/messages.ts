import {Card} from "./deck"

export interface PatchGame {
  // drawFromDeck, dropToDeck, moveFromDeck
  action: string 
  count?: number
  fromPile?: string
  toPile?: string

  // top, botton, random, select
  drawFrom?: string
  dropTo?: string
  select?: string
  cards?: Card[]
}
