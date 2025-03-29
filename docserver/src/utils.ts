import { join } from 'node:path'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import * as yaml from 'js-yaml'

import { Deck, DeckPresets, Card } from './models/deck'

const PRESETS_DEFAULT:  DeckPresets = {
  count: 1, split: 1, shuffle: true, atomic: false, replacement: false
}

export const loadDecks = (decksDir: string): Deck[] => {

  if (!existsSync(decksDir)) {
    console.error(`Decks directory does not exists: ${decksDir}`)
    process.exit(-1)
  }

  console.info(`Loading decks from ${decksDir}`)

  return readdirSync(decksDir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map(f => join(decksDir, f))
    .map(f => {
        const deck = yaml.load(readFileSync(f, 'utf-8')) as Deck
        if (!deck.spec.presets)
          deck.spec.presets = PRESETS_DEFAULT
        else
          deck.spec.presets = {
            ...PRESETS_DEFAULT,
            ...deck.spec.presets
          }
        console.info(`[Loading] Id: ${deck.metadata.id}, Kind: ${deck.kind}, Name: ${deck.metadata.name}`)
        return deck
    })
}

export const shuffleDeck = (cards: Card[]) => {
  for (let i = 0; i < cards.length; i++) {
    const j = Math.floor(Math.random() * (i + 1)); 
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
}

export const drawFromTop = (cards: Card[], count = 1) => {
  return {
    drawn: cards.slice(0, count),
    remainder: cards.slice(count)
  }
}

export const drawFromBotton = (cards: Card[], count = 1) => {
  const start = Math.min(0, (cards.length - count))
  return {
    drawn: cards.slice(start),
    remainder: cards.slice(0, start)
  }
}

export const drawRandomly = (cards: Card[], count = 1) => {
  const drawn: Card[] = []
  let remainder = { ...cards }
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * remainder.length)
    drawn.push(remainder[idx])
    remainder = remainder.splice(idx, 1)
  }

  return { drawn, remainder }
}

export const dropToTop = (cards: Card[], toAdd: Card[]) => {
  return [ ...toAdd, ...cards ]
}
export const dropToBottom = (cards: Card[], toAdd: Card[]) => {
  return [ ...cards, ...toAdd ]
}
export const dropRandomly = (cards: Card[], toAdd: Card[]) => {
  const _cards = [ ...cards ]
  for (let c of toAdd) {
    const idx = Math.floor(Math.random() * _cards.length)
    _cards.splice(idx, 0, c)
  }
  return _cards
}
