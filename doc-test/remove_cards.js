
const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'

const run = async () => {
  const { gameId } = await got.post(`${BASE_URL}/deck/${deckId}`, { json: { split: 2 } }).json()

  let status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  const payload = { count: 3, drawFrom: 'random' }
  const result = await got.delete(`${BASE_URL}/game/${gameId}/cards`, { json: payload }).json()
  console.info(`Remove card from pile_0:`, result)

  status = await got(`${BASE_URL}/game/${gameId}/status`).json()
  console.info('>>> status: ', status)

  await got.delete(`${BASE_URL}/game/${gameId}`)
  console.info(`Game ${gameId} DELETED`)
}

run()
