package deck

import (
	"os"

	"github.com/oklog/ulid/v2"
	"gopkg.in/yaml.v3"
)

type Metadata struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
}

type Card struct {
	Code   string            `yaml:"code"`
	Image  string            `yaml:"image"`
	Value  string            `yaml:"value"`
	Suit   string            `yaml:"suit"`
	Count  uint              `yaml:"count"`
	Images map[string]string `yaml:",flow"`
}

type Spec struct {
	Cards []Card `yaml:"cards"`
}

type Deck struct {
	ApiVersion string   `yaml:"apiVersion"`
	Kind       string   `yaml:"kind"`
	Metadata   Metadata `yaml:"metadata"`
	Spec       Spec     `yaml:"spec"`
}

type DeckInstance struct {
	Name      string
	DeckId    string
	Shuffled  bool
	Remaining []Card
}

func (deck Deck) CreateInstance(count uint) *DeckInstance {
	var deckInst = &DeckInstance{
		Name:      deck.Metadata.Name,
		DeckId:    ulid.Make().String(),
		Shuffled:  false,
		Remaining: append(deck.Spec.Cards),
	}
	for i := uint(1); i < count; i++ {
		deckInst.Remaining = append(deckInst.Remaining, deck.Spec.Cards...)
	}
	return deckInst
}

func New(file string) (*Deck, error) {

	data, err := os.ReadFile(file)
	if nil != err {
		return nil, err
	}

	var deck = Deck{}
	if err = yaml.Unmarshal(data, &deck); nil != err {
		return nil, err
	}

	// Initialise all count from 0 to 1
	for idx, card := range deck.Spec.Cards {
		if 0 == card.Count {
			deck.Spec.Cards[idx].Count = 1
		}
	}

	return &deck, nil
}
