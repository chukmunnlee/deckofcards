export interface PutGame {
  // draw, drop, move
  count?: number // default 1
  fromPile?: string // default pile_0
  toPile?: string // default discarded

  // top, botton, random, select
  drawFrom?: string // default top
  dropTo?: string // default top
  select?: string[]
}

export interface DeleteCardsFromPile {
  count?: number // default 1
  fromPile?: string // default pile_0
  // top, botton, random, select
  drawFrom?: string, // default top
  select?: string[]
}

export interface PatchCardsToPile {
  toPile?: string // default pile_0
  // top, botton, random
  dropTo?: string // default top
  cards?: string[] // code
  shuffle?: boolean
}
