package deck

import (
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"strings"
)

type CardDecks struct {
	decks map[string]*Deck
}

func (cd CardDecks) GetAllDecks() map[string]*Deck {
	return cd.decks
}

func (cd CardDecks) FindDeckByName(name string) (*Deck, error) {
	_n := strings.ToLower(name)
	for k, d := range cd.decks {
		if k == strings.ToLower(_n) {
			return d, nil
		}
	}
	return nil, fmt.Errorf("Cannot find deck: %s", name)
}

func LoadDecks(deckRoot string) CardDecks {
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
		deckMap[strings.ToLower(deck.Metadata.Name)] = deck
	}

	return CardDecks{decks: deckMap}
}
