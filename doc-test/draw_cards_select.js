const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'
const DRAW_COUNT = 3
const PEEK_COUNT = 10

const run = async () => {

  // Crate game
  const { gameId } = await got.post(`${BASE_URL}/deck/${deckId}`, { json: { split: 2 } }).json()

  // Check status
  let status = await got(`${BASE_URL}/game/${gameId}`).json()
  console.info('>>> status: ', status)

  let cards = await got(`${BASE_URL}/game/${gameId}/pile/pile_1`, { searchParams: { count: 10 } }).json()
  cards = cards.map(c => c.code)
  console.info('>> pile_1 top 10 cards: ', cards)
  const select = [ cards[1], cards[5], cards[8] ]

  console.info('>> select: ', select)

  let resp = await got.put(`${BASE_URL}/game/${gameId}/pile`, 
      { json: { action: 'draw', fromPile: 'pile_1', drawFrom: 'select', select } }).json()
  console.info('>> drawn from select pile_1 cards: ', resp.cards.map(c => c.code ))

  status = await got(`${BASE_URL}/game/${gameId}`).json()

  cards = await got(`${BASE_URL}/game/${gameId}/pile/pile_1`, { searchParams: { count: 10 } }).json()
  cards = cards.map(c => c.code)
  console.info('>> pile_1 top 10 cards: ', cards)

  status = await got(`${BASE_URL}/game/${gameId}`).json()
  console.info('>>> status: ', status)

  await got.delete(`${BASE_URL}/game/${gameId}`)
  console.info(`Game ${gameId} DELETED`)
}

run()

