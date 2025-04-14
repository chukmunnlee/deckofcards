const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'

const run = async () => {

  const { gameId } = await got.post(`${BASE_URL}/deck/${deckId}`).json()

  const gameUrl = `${BASE_URL}/game/${gameId}`

  let status = await got(`${gameUrl}`).json()

  console.info('>>>> status: ', status)

  let cards = await got(`${gameUrl}/pile`, { searchParams: { count: 20 } }).json()
  let codes = cards.map(card => card.code)

  let selected = []
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * codes.length)
    selected.push(codes[idx])
  }

  console.info('>>> codes: ', codes)
  console.info('>>> selected: ', selected)

  let result = await got.delete(`${gameUrl}/pile`, { json: { select: selected } }).json()
  codes = result.cards.map(c => c.code)
  console.info('>>> after pick cards: ', codes)

  status = await got(`${gameUrl}`).json()
  console.info('>>>> after pick status: ', status)

  result = await got.patch(`${gameUrl}/pile`, { json: { cards: codes, toPile: 'fred', shuffle: true } }).json()
  codes = result.cards.map(c => c.code)
  console.info('>>> after drop cards: ', codes)

  status = await got(`${gameUrl}`).json()
  console.info('>>>> after drop status: ', status)

  cards = await got(`${gameUrl}/pile/fred`, { searchParams: { count: 20 } }).json()
  codes = cards.map(card => card.code)
  console.info('>>> after drop fred pile: ', codes)

  await got.delete(gameUrl)
  console.info(`Game ${gameId} DELETED`)
}

run()
