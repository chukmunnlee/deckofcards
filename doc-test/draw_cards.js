const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'
const DRAW_COUNT = 3
const PEEK_COUNT = 8
const PILE_FRED = 'pile_fred'

const run = async () => {
  const { gameId } = await got.post(`${BASE_URL}/deck/${deckId}`, { json: { split: 2 } }).json()

  let status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  let cards = await got(`${BASE_URL}/game/${gameId}/pile`, { searchParams: { count: PEEK_COUNT } }).json()
  console.info('>> pile_0 cards: ', cards.map(c => c.code ))

  cards = await got(`${BASE_URL}/game/${gameId}/pile/pile_1`, { searchParams: { count: PEEK_COUNT } }).json()
  console.info('>> pile_1 cards: ', cards.map(c => c.code ))

  let resp = await got.patch(`${BASE_URL}/game/${gameId}`, 
      { json: { action: 'draw', count: DRAW_COUNT, fromPile: 'pile_0' } }).json()
  cards = resp.cards
  console.info('>> drawn from pile_0 cards: ', cards.map(c => c.code ))

  cards = await got(`${BASE_URL}/game/${gameId}/pile`, { searchParams: { count: PEEK_COUNT } }).json()
  console.info('++ pile_0 cards: ', cards.map(c => c.code ))

  resp = await got.patch(`${BASE_URL}/game/${gameId}`, 
      { json: { action: 'draw', count: DRAW_COUNT, fromPile: 'pile_0', toPile: PILE_FRED } }).json()
  cards = resp.cards
  console.info('>> drawn from pile_0 cards to pile_fred: ', cards.map(c => c.code ))

  cards = await got(`${BASE_URL}/game/${gameId}/pile/drawn`, { searchParams: { count: PEEK_COUNT } }).json()
  console.info('++ drawn cards: ', cards.map(c => c.code ))

  cards = await got(`${BASE_URL}/game/${gameId}/pile/${PILE_FRED}`, { searchParams: { count: PEEK_COUNT } }).json()
  console.info(`++ ${PILE_FRED} cards: `, cards.map(c => c.code ))

  status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  await got.delete(`${BASE_URL}/game/${gameId}`)
  console.info(`Game ${gameId} DELETED`)
}

run()

