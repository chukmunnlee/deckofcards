package main

import (
	"fmt"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-gonic/gin"
)

func main() {

	opts := parseCLI()

	deckMap := deck.LoadDecks(opts.DeckRoot)

	for k, e := range deckMap {
		fmt.Printf("%s: %s\n", k, e.Metadata.Description)
	}

	r := gin.Default()

	r.Run(fmt.Sprintf(":%d", opts.Port))
}
