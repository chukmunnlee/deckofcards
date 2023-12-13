package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var GitCommit string

func main() {

	opts := parseCLI()

	cardDecks := deck.LoadDecks(opts.DeckRoot)

	if opts.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	}

	storage := &deck.DeckStorage{}
	storage.Init(make(map[string]string))

	r := gin.Default()

	if opts.EnableCORS {
		log.Printf("Enabling CORS")
		config := cors.DefaultConfig()
		config.AllowOrigins = []string{"*"}
		config.AllowHeaders = []string{"Cache-Control", "Content-Type"}
		r.Use(cors.New(config))
	}

	r.NoRoute(gin.WrapH(http.FileServer(http.Dir("static"))))

	// DECK
	// GET /api/decks - get a list of all registered decks
	registerGET("/api/decks", mkApiDecks(cardDecks, storage), r)

	// GET /api/deck/:deck_id/cards - list all cards from a deck
	registerGET(fmt.Sprintf("/api/deck/:%s/cards", PARAM_DECK_ID),
		mkApiDeckCards(cardDecks, storage), r)

	// POST /api/deck - create a deck
	// Content-Type: application/json
	// { "jokers_enabled": false, "deck_name": "deck_name", "deck_count": 1, "shuffle": true }
	registerPOST("/api/deck", mkApiDeckNew(opts.DeckLimit, cardDecks, storage), r)

	// DECK INSTANCE
	// GET /api/deck/:deck_id?count=2 - draw cards from a deck
	registerGET(fmt.Sprintf("/api/deck/:%s", PARAM_DECK_ID),
		mkApiDeckDraw(cardDecks, storage), r)

	// PUT /api/deck/:deck_id?remaining=true - recreate the deck for the same deck_id, clear all Piles
	//   or shuffle the remaining, piles are not clear
	registerPUT(fmt.Sprintf("/api/deck/:%s", PARAM_DECK_ID),
		mkApiDeckPut(cardDecks, storage), r)

	// PATCH /api/deck/:deck_id?cards=AS,C3,shuffle=true - add additional cards to deck or pile
	registerPATCH(fmt.Sprintf("/api/deck/:%s", PARAM_DECK_ID),
		mkApiDeckPatch(cardDecks, storage), r)

	// DELETE /api/deck/:deck_id - delete a deck
	registerDELETE(fmt.Sprintf("/api/deck/:%s", PARAM_DECK_ID),
		mkApiDeckDelete(cardDecks, storage), r)

	// GET /api/deck/:deck_id/contents - show the deck's contents
	registerGET(fmt.Sprintf("/api/deck/:%s/contents", PARAM_DECK_ID),
		mkApiDeckGetContents(cardDecks, storage), r)

	// GET /api/deck/:deck_id/status - show the decks's information
	registerGET(fmt.Sprintf("/api/deck/:%s/status", PARAM_DECK_ID),
		mkApiDeckStatus(cardDecks, storage), r)

	// GET /api/deck/:deck_id/back - get back image of card
	registerGET(fmt.Sprintf("/api/deck/:%s/back", PARAM_DECK_ID),
		mkApiDeckBack(cardDecks, storage), r)

	// PILES
	// GET /api/deck/:deck_id/piles - list all the piles in a deck instance
	registerGET(fmt.Sprintf("/api/deck/:%s/piles", PARAM_DECK_ID),
		mkApiPilesGet(cardDecks, storage), r)

	// POST /api/deck/:deck_id/piles - create a pile in a deck instance
	registerPOST(fmt.Sprintf("/api/deck/:%s/piles", PARAM_DECK_ID),
		mkApiPilesPost(cardDecks, storage), r)

	// GET /api/deck/:deck_id/pile/:pile_name - draw one or more cards from a pile
	registerGET(fmt.Sprintf("/api/deck/:%s/pile/:%s", PARAM_DECK_ID, PARAM_PILE_NAME),
		mkApiPileGet(cardDecks, storage), r)

	// GET /api/deck/:deck_id/pile/:pile_name/contents - show the contents of a pile
	registerGET(fmt.Sprintf("/api/deck/:%s/pile/:%s/contents", PARAM_DECK_ID, PARAM_PILE_NAME),
		mkApiDeckGetContents(cardDecks, storage), r)

	// GET /api/deck/:deck_id/pile/:pile_name/status - show the status of a pile
	registerGET(fmt.Sprintf("/api/deck/:%s/pile/:%s/status", PARAM_DECK_ID, PARAM_PILE_NAME),
		mkApiPileStatus(cardDecks, storage), r)

	// PUT /api/deck/:deck_id/pile/:pile_name
	registerPUT(fmt.Sprintf("/api/deck/:%s/pile/:%s", PARAM_DECK_ID, PARAM_PILE_NAME),
		mkApiPilePut(cardDecks, storage), r)

	// PUT /api/pile/:pile_name/deck/:deck_id - return pile to main deck
	registerPUT(fmt.Sprintf("/api/pile/:%s/deck/:%s", PARAM_PILE_NAME, PARAM_DECK_ID),
		mkApiPutPileToDeck(cardDecks, storage), r)

	// PATCH /api/deck/:deck_id/pile/:pile_name?cards=AS,C3,shuffle=true - create custom deck or pile
	//   add cards to main pile or named pile
	registerPATCH(fmt.Sprintf("/api/deck/:%s/pile/:%s", PARAM_DECK_ID, PARAM_PILE_NAME),
		mkApiDeckPatch(cardDecks, storage), r)

	// /version
	registerGET("/version", mkVersion(GitCommit), r)
	// /health
	registerGET("/health", mkVersion(GitCommit), r)

	log.Printf("Starting deckofcards on port %d on %s",
		opts.Port, time.Now().Format("01-02-2006 15:04:05 MST"))

	if err := r.Run(fmt.Sprintf(":%d", opts.Port)); nil != err {
		log.Panicf("Cannot start deckofcards: %s", err.Error())
	}
}
