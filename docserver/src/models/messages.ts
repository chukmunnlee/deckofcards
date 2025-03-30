import {Card} from "./deck"

export interface PatchGame {
  // draw, drop, move
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
