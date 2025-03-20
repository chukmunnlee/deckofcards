import {Card} from "./deck"

export interface PatchGame {
  // drawFromDeck, dropToDeck, moveFromDeck
  action: string 
  // top, botton, random, select
  drawFrom?: string
  dropTo?: string
  count?: number
  select?: string
  fromPile?: string
  toPile?: string
  cards?: Card[]
}
