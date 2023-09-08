package deck

import (
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
)

func LoadDecks(deckRoot string) map[string]*Deck {
	files, err := ioutil.ReadDir(deckRoot)
	if nil != err {
		log.Fatal(err)
	}

	deckMap := make(map[string]*Deck)

	pattern := "*.yaml"
	for _, f := range files {
		match, err := filepath.Match(pattern, f.Name())
		if nil != err {
			log.Fatalf("Error: %s", err)
		}
		if !match {
			continue
		}
		def := fmt.Sprintf("%s/%s", deckRoot, f.Name())
		deck, err := New(def)
		if nil != err {
			log.Printf("Error parsing deck: %s\n", def)
			continue
		}
		deckMap[deck.Metadata.Name] = deck
	}

	return deckMap
}
