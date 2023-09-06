package main

import (
	"fmt"

	"github.com/chukmunnlee/deckofcards/deck"
)

func main() {
	var doc, err = deck.New("./assets/standarddeckwithjokers.yaml")
	if nil != err {
		panic(err)
	}

	fmt.Printf("deck: %v\n", *&doc.Metadata)

	deckInst := doc.CreateInstance(1)
	fmt.Printf("ulid: %s\n", deckInst.DeckId)
	fmt.Printf("count: %d\n", len(deckInst.Remaining))

	count := 0
	for _, c := range deckInst.Remaining {
		if "AS" == c.Code {
			count++
		}
	}
	fmt.Printf("AS count: %d\n", count)

	count = 0
	deckInst = doc.CreateInstance(2)
	for _, c := range deckInst.Remaining {
		if "AS" == c.Code {
			count++
		}
	}
	fmt.Printf("ulid: %s\n", deckInst.DeckId)
	fmt.Printf("count: %d\n", len(deckInst.Remaining))
	fmt.Printf("AS count: %d\n", count)

}
