const { got } = require('got')

const BASE_URL = 'http://localhost:3000/api'
const deckId = '01HGD6P985BBSQ1VSFQ88FZ9FF'

got.post(`${BASE_URL}/deck/${deckId}`).json()
  .then(({ gameId }) => got(`${BASE_URL}/game/${gameId}`).json())
  .then(result => {
    console.info('status: ', result)
    return got(`${BASE_URL}/games`).json()
  })
  .then(result => {
    console.info('>>>> games: ', result)
    return got.delete(`${BASE_URL}/game/${result.gameId}`)
  })
  .then(() => console.info('DELETED'))
  
