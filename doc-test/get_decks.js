const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'

// GET /api/decks
got(`${BASE_URL}/decks`).json()
  .then(result => {
    console.info('result: ', result)
    return Promise.all(result.map(deck => got(`${BASE_URL}/deck/${deck.id}/presets`).json()))
  })
  .then(result => {
    console.info('>>> presets: ', result)
  })
