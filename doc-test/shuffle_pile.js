const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'

const run = async () => {

  const codes = await got(`${BASE_URL}/deck/${deckId}/codes`).json()

  let cards = []
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * codes.length)
    cards.push(codes[idx])
  }

  console.info('>>> selected cards: ', cards)

  const { gameId } = await got.post(`${BASE_URL}/deck/${deckId}`, { json: { cards } }).json()

  let status = await got(`${BASE_URL}/game/${gameId}`).json()
  console.info('>>> status: ', status)

  cards = await got(`${BASE_URL}/game/${gameId}/pile`, { searchParams: { count: 10 } }).json()
  console.info('>>> cards on pile_0: ', cards.map(card => card.code))

  let result = await got.patch(`${BASE_URL}/game/${gameId}/pile`, { json: { shuffle: true } }).json()
  console.info('>>>> result after patch: ', result)

  cards = await got(`${BASE_URL}/game/${gameId}/pile`, { searchParams: { count: 10 } }).json()
  console.info('>>> cards on pile_0 after shuffle: ', cards.map(card => card.code))

  await got.delete(`${BASE_URL}/game/${gameId}`)
  console.info(`Game ${gameId} DELETED`)
}

run()
