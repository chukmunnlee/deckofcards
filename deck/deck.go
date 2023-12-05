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

func (cd CardDecks) FindDeckById(id string) (*Deck, error) {
	_n := strings.ToLower(id)
	for _, d := range cd.decks {
		if _n == strings.ToLower(d.Metadata.Id) {
			return d, nil
		}
	}
	return nil, fmt.Errorf("Cannot find deck with id: %s", id)
}
func (cd CardDecks) FindDeckByName(name string) (*Deck, error) {
	_n := strings.ToLower(name)
	for k, d := range cd.decks {
		if _n == strings.ToLower(k) {
			return d, nil
		}
	}
	return nil, fmt.Errorf("Cannot find deck with name: %s", name)
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
		log.Printf("Loading %s\n", def)
		deck, err := New(def)
		if nil != err {
			log.Printf("Error parsing deck: %s\n", def)
			continue
		}
		deckMap[strings.ToLower(deck.Metadata.Name)] = deck

		//dumpTree(deck.Root)
	}

	return CardDecks{decks: deckMap}
}
