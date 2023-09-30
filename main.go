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

	// GET /api/decks
	registerGET("/api/decks", mkApiDecks(cardDecks, storage), r)

	// POST /api/deck
	// Content-Type: application/json
	// { "jokers_enabled": false, "deck_name": "deck_name", "deck_count": 1, "shuffle": true }
	registerPOST("/api/deck", mkApiDeckNew(opts.DeckLimit, cardDecks, storage), r)

	// GET /api/deck/:deck_id?count=2
	registerGET(fmt.Sprintf("/api/deck/:%s", PARAM_DECK_ID),
		mkApiDeckDraw(cardDecks, storage), r)

	// PUT /api/deck/:deck_id?remaining=true
	registerPUT(fmt.Sprintf("/api/deck/:%s", PARAM_DECK_ID),
		mkApiDeckPut(cardDecks, storage), r)

	// DELETE /api/deck/:deck_id
	registerDELETE(fmt.Sprintf("/api/deck/:%s", PARAM_DECK_ID),
		mkApiDeckDelete(cardDecks, storage), r)

	// GET /api/deck/:deck_id/status
	registerGET(fmt.Sprintf("/api/deck/:%s/status", PARAM_DECK_ID),
		mkApiDeck(cardDecks, storage), r)

	// GET /api/deck/:deck_id/back
	registerGET(fmt.Sprintf("/api/deck/:%s/back", PARAM_DECK_ID),
		mkApiDeckBack(cardDecks, storage), r)

	// GET /api/deck/:deck_id/piles
	registerGET(fmt.Sprintf("/api/deck/:%s/piles", PARAM_DECK_ID),
		mkApiPilesGet(cardDecks, storage), r)

	// GET /api/deck/:deck_id/piles
	registerPOST(fmt.Sprintf("/api/deck/:%s/piles", PARAM_DECK_ID),
		mkApiPilesPost(cardDecks, storage), r)

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
