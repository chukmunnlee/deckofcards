# Deck of Cards API

A deck of cards API inspired by [Deck of Cards API](https://www.deckofcardsapi.com/). The server is written in Golang using [Gin Gonic](https://github.com/gin-gonic/gin) web framework.

Check out a deployed version at [deckofcards.chuklee.com](https://deckofcards.chuklee.com).

## List of supported APIs

### Card Decks

- `GET /api/decks` - get a list of all registered decks
- `GET /api/deck/:deck_id/cards` - list all the cards from a deck

### Deck Instance

- `POST /api/deck` - create a deck instance
- `GET /api/deck/:deck_id` - draw one or more cards from a deck instance, **NOT IDEMPOTENT**
- `PUT /api/deck/:deck_id` - recreate the deck for the deck instance, clear all piles
- `PATCH /api/deck/:deck_id` - add additional cards to deck
- `DELETE /api/deck/:deck_id` - delete a deck instance
- `GET /api/deck/:deck_id/contents` - show the contents of a deck instance
- `GET /api/deck/:deck_id/status` - show the status of a deck instance without revealing the cards in the deck instance
- `GET /api/deck/:deck_id/back` - get back image of a deck instance

### Deck Instance Piles

- `GET /api/deck/:deck_id/piles` - list all the pile names in a deck instance
- `POST /api/deck/:deck_id/piles` - create a pile in a deck instance
- `GET /api/deck/:deck_id/pile/:pile_name` - draw one or more cards from a pile, **NOT IDEMPOTENT**
- `GET /api/deck/:deck_id/pile/:pile_name/contents` - show the contents of a pile
- `GET /api/deck/:deck_id/pile/:pile_name/status` - show the status of a pile with out revealing the cards in the pile
- `PUT /api/deck/:deck_id/pile/:pile_name` - reshuffle the pile
- `PUT /api/pile/:pile_name/deck/:deck_id` - return pile to main deck
- `PATCH /api/deck/:deck_id/pile/:pile_name` - add additional cards to the pile

### Management

- `GET /version` - version
- `GET /health` - health

## Your own card deck

Thinking of creating your own card deck. See examples in [assets](https://github.com/chukmunnlee/deckofcards/tree/master/assets).

If you are using this project to make something cool, let me know!
