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

	cardDecks := deck.LoadDecks(opts.DeckRoot)

	if opts.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// return a list of registered decks
	register("/api/decks", mkApiDecks(cardDecks), r)

	// /api/deck/new?jokers_enabled=true&deck_name=deck_name
	register("/api/deck/new", mkApiDeckNew(cardDecks), r)

	// /api/deck/new/shuffle?deck_count=1&jokers_enabled=true&deck_name=deck_name
	register("/api/deck/new/shuffle", mkApiDeckNew(cardDecks), r)

	log.Printf("Starting deckofcards on port %d on %s",
		opts.Port, time.Now().Format("01-02-2006 15:04:05 MST"))

	r.Run(fmt.Sprintf(":%d", opts.Port))
}
