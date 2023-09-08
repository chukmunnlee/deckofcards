package main

import (
	"fmt"

	"github.com/chukmunnlee/deckofcards/deck"
)

func main() {

	opts := parseCLI()

	deckMap := deck.LoadDecks(opts.DeckRoot)

	for k, e := range deckMap {
		fmt.Printf("%s: %s\n", k, e.Metadata.Description)
	}
}
