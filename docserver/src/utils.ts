import { join } from 'node:path'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import * as yaml from 'js-yaml'

import { Deck, DeckPresets, Card } from 'src/models/deck'
import {Game, Pile} from "src/models/game";

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
  const start = Math.max(0, (cards.length - count))
  return {
    drawn: cards.slice(start),
    remainder: cards.slice(0, start)
  }
}

export const drawRandomly = (cards: Card[], count = 1) => {
  const drawn: Card[] = []
  let remainder = [ ...cards ]
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * remainder.length)
    drawn.push(remainder[idx])
    remainder.splice(idx, 1)
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


const createGameDeck = (game: Game, cards: Card[]) => {
    let _cards: Card[] = []
    // Create full deck 
    for (let c of cards) 
      for (let i = 0; i < (c.count ?? 1); i++)
        _cards = [ ..._cards, c ]
      //
    // Create the number of decks
    // @ts-ignore
    for (let i = 0; i < game.presets?.count; i++)
      _cards = [ ..._cards, ...cards ]

    if (game.presets?.shuffle) 
      shuffleDeck(_cards)

    // @ts-ignore
    let pileCount = _cards.length / game.presets.split | 0
    
    // @ts-ignore
    for (let i = 0; i < game.presets.split; i++) {
      const name = `pile_${i}`
      const startIdx = pileCount * i
      const endIdx = startIdx + pileCount
      game.piles[name] = {
        name,
        cards: _cards.slice(startIdx, endIdx)
      } as Pile
    }

    return game
  }

const createAtomicGameDeck = (game: Game, cards: Card[]) => {
    // @ts-ignore
    for (let i = 0; i < game.presets.count; i++) {
      const name = `pile_${i}`
      const _cards = [ ...cards ]
      if (game.presets.shuffle)
        shuffleDeck(_cards)
      game.piles[name] = { name, cards: _cards }
    }
    return game
  }

export const createPlayingDeck = (game: Game, cards: Card[]) => {

  const _game: Game = { ...game }

  if (_game.presets.atomic) 
    createAtomicGameDeck(_game, cards)

  else 
    createGameDeck(_game, cards)

  _game.piles['drawn'] = { name: 'drawn', cards: [] }
  _game.piles['discarded'] = { name: 'discarded', cards: [] }

  return _game
}
