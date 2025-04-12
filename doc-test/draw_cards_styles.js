const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'
const DRAW_COUNT = 3
const PEEK_COUNT = 10

const run = async () => {

  // Crate game
  const { gameId } = await got.post(`${BASE_URL}/deck/${deckId}`, { json: { split: 2 } }).json()

  // Check status
  let status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  let resp = await got.put(`${BASE_URL}/game/${gameId}/pile`, 
      { json: { action: 'draw', count: DRAW_COUNT, fromPile: 'pile_0', drawFrom: 'top' } }).json()
  console.info('>> drawn from top pile_0 cards: ', resp.cards.map(c => c.code ))
  status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> top status: ', status)
  console.info('-----------------------------------------------\n')

  resp = await got.put(`${BASE_URL}/game/${gameId}/pile`, 
      { json: { action: 'draw', count: DRAW_COUNT, fromPile: 'pile_0', drawFrom: 'bottom' } }).json()
  console.info('>> drawn bottom pile_0 cards: ', resp.cards.map(c => c.code ))
  status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> bottom status: ', status)
  console.info('-----------------------------------------------\n')

  resp = await got.put(`${BASE_URL}/game/${gameId}/pile`, 
      { json: { action: 'draw', count: DRAW_COUNT, fromPile: 'pile_0', drawFrom: 'random' } }).json()
  console.info('>> drawn random pile_0 cards: ', resp.cards.map(c => c.code ))

  cards = await got(`${BASE_URL}/game/${gameId}/pile/drawn`, { searchParams: { count: PEEK_COUNT } }).json()
  console.info('++ drawn cards: ', cards.map(c => c.code ))

  status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  await got.delete(`${BASE_URL}/game/${gameId}`)
  console.info(`Game ${gameId} DELETED`)
}

run()

