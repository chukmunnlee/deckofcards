const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'

const run = async () => {

  const codes = await got(`${BASE_URL}/deck/${deckId}/codes`).json()

  let cards = []
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * codes.length)
    cards.push(codes[idx])
    cards.push(codes[idx])
  }

  console.info('>>> selected cards: ', cards)

  const { gameId } = await got.post(`${BASE_URL}/deck/${deckId}`, { json: { cards, split: 2 } }).json()

  let status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  //cards = await got(`${BASE_URL}/game/${gameId}/pile`, { searchParams: { count: cards.length } }).json()
  for (let i = 0; i < 2; i++) {
    cards = await got(`${BASE_URL}/game/${gameId}/pile/pile_${i}`, { searchParams: { count: 500 } }).json()
    console.info(`++ pile_${i} cards: `, cards.map(c => c.code ))
  }

  await got.delete(`${BASE_URL}/game/${gameId}`)
  console.info(`Game ${gameId} DELETED`)

}

run()
