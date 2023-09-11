package main

import (
	"fmt"
	"log"
	"time"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-gonic/gin"
)

func main() {

	opts := parseCLI()

	deckMap := deck.LoadDecks(opts.DeckRoot)

	if opts.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// return a list of registered decks
	register("/api/decks", mkApiDecks(deckMap), r)

	// /api/deck/new

	log.Printf("Starting deckofcards on port %d on %s",
		opts.Port, time.Now().Format("01-02-2006 15:04:05 MST"))

	r.Run(fmt.Sprintf(":%d", opts.Port))
}

func register(endpoint string, handler gin.HandlerFunc, app *gin.Engine) {
	log.Printf("Endpoint: %s", endpoint)
	app.GET(endpoint, handler)
	app.POST(endpoint, handler)
}
