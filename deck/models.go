package deck

import (
	"math/rand"
	"os"
	"slices"

	"github.com/oklog/ulid/v2"
	"gopkg.in/yaml.v3"
)

const (
	PILE_DISCARDED = "discarded"
)

type Metadata struct {
	Id          string `yaml:"id"`
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
}

type Card struct {
	Code   string            `yaml:"code" json:"code"`
	Image  string            `yaml:"image" json:"image"`
	Value  string            `yaml:"value" json:"value"`
	Suit   string            `yaml:"suit" json:"suit"`
	Count  uint              `yaml:"count" json:"count"`
	Images map[string]string `yaml:",flow" json:"images,flow"`
}

type Spec struct {
	BackImage string `yaml:"backImage"`
	Cards     []Card `yaml:"cards"`
}

type Deck struct {
	ApiVersion string   `yaml:"apiVersion"`
	Kind       string   `yaml:"kind"`
	Metadata   Metadata `yaml:"metadata"`
	Spec       Spec     `yaml:"spec"`
}

type DeckInstance struct {
	Id        string
	Name      string
	DeckId    string
	Shuffled  bool
	Count     uint
	Remaining []Card
	Piles     map[string][]Card
}

type DeckInfo struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type PileInfo struct {
	Remaining uint `json:"remaining"`
}

// Deck
func (deck Deck) CreateInstance(count uint) *DeckInstance {
	var deckInst = &DeckInstance{
		Id:       deck.Metadata.Id,
		Name:     deck.Metadata.Name,
		DeckId:   ulid.Make().String(),
		Count:    count,
		Shuffled: false,
	}
	for i := uint(0); i < count; i++ {
		deckInst.Remaining = append(deckInst.Remaining, deck.Spec.Cards...)
	}
	deckInst.Piles = make(map[string][]Card)
	deckInst.Piles[PILE_DISCARDED] = make([]Card, 0)

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
	cards := []Card{}
	for idx, card := range deck.Spec.Cards {
		if 0 == card.Count {
			deck.Spec.Cards[idx].Count = 1
		}
		for i := 0; i < int(deck.Spec.Cards[idx].Count); i++ {
			c := deck.Spec.Cards[idx]
			cards = append(cards, c)
		}
	}

	deck.Spec.Cards = cards

	return &deck, nil
}

// DeckInstance
func (deckInst *DeckInstance) Draw(count int, pileName string) []Card {
	drawn, remaining := draw(count, deckInst.Remaining)
	deckInst.Remaining = *remaining
	deckInst.AddToPile(*drawn, pileName)
	return *drawn
}

func (deckInst *DeckInstance) CreatePile(pileName string) bool {
	_, ok := deckInst.Piles[pileName]
	if ok {
		return false
	}
	deckInst.Piles[pileName] = make([]Card, 0)
	return true
}

func (deckInst *DeckInstance) AddToPile(cards []Card, pileName string) {
	deckInst.Piles[pileName] = append(deckInst.Piles[pileName], cards...)
}

func (deckInst DeckInstance) GetPiles() map[string]PileInfo {
	piles := make(map[string]PileInfo, 0)
	for k, v := range deckInst.Piles {
		piles[k] = PileInfo{Remaining: uint(len(v))}
	}
	return piles
}

func draw(count int, deck []Card) (*[]Card, *[]Card) {
	if len(deck) < count {
		count = len(deck)
	}

	drawn := deck[0:count]
	remainder := slices.Delete(deck, 0, count)

	return &drawn, &remainder
}

func drawBottom(count int, deck []Card) (*[]Card, *[]Card) {
	start := len(deck) - count
	if start < 0 {
		start = 0
	}

	drawn := deck[start : start+count]
	remainder := slices.Delete(deck, start, start+count)

	return &drawn, &remainder
}

func drawRandom(count int, deck []Card) (*[]Card, *[]Card) {
	drawn := make([]Card, 0)
	remainder := deck
	if len(deck) < count {
		count = len(deck)
	}

	for i := 0; i < count; i++ {
		idx := rand.Intn(len(deck))
		drawn = append(drawn, deck[idx])
		remainder = slices.Delete(remainder, idx, 1)
	}

	return &drawn, &remainder
}
