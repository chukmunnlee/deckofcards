import { join } from 'node:path'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import * as yaml from 'js-yaml'

import { Deck, DeckPresets } from './models/deck'

const PRESETS_DEFAULT:  DeckPresets = {
  count: 1, split: 1, shuffle: true, replacement: false
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
