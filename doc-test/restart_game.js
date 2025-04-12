const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'
const DRAW_COUNT = 3
const PEEK_COUNT = 8

const run = async () => {
  const { gameId } = await got.post(`${BASE_URL}/deck/${deckId}`, { json: { split: 2 } }).json()

  let status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  let cards = await got(`${BASE_URL}/game/${gameId}/pile`, { searchParams: { count: PEEK_COUNT } }).json()
  console.info('>> pile_0 cards: ', cards.map(c => c.code ))

  let resp = await got.put(`${BASE_URL}/game/${gameId}/pile`, 
      { json: { action: 'draw', count: DRAW_COUNT, fromPile: 'pile_0' } }).json()
  cards = resp.cards
  console.info('>> drawn from pile_0 cards: ', cards.map(c => c.code ))

  status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  cards = await got.post(`${BASE_URL}/game/${gameId}`).json()

  status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> restart status: ', status)

  await got.delete(`${BASE_URL}/game/${gameId}`)
  console.info(`Game ${gameId} DELETED`)
}

run()

