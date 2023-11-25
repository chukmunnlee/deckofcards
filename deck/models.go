package deck

import (
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"

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
	Root       *BTreeNode
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

type BTreeNode struct {
	Card  *Card
	Left  *BTreeNode
	Right *BTreeNode
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

func (dk Deck) CreateCustomInstance(cards string, count uint) *DeckInstance {
	var deckInst = &DeckInstance{
		Id:       dk.Metadata.Id,
		Name:     dk.Metadata.Name,
		DeckId:   ulid.Make().String(),
		Count:    count,
		Shuffled: false,
	}
	codes := strings.Split(strings.TrimSpace(cards), ",")
	for _, c := range codes {
		for _, pc := range dk.Spec.Cards {
			if c == pc.Code {
				deckInst.Remaining = append(deckInst.Remaining, pc)
				break
			}
		}
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
		c := cards[len(cards)-1]
		if nil == deck.Root {
			deck.Root = &BTreeNode{Card: &c}
		} else {
			deck.Root.Add(&c)
		}
	}

	deck.Spec.Cards = cards

	return &deck, nil
}

// DeckInstance
func (deckInst *DeckInstance) Draw(count int) []Card {
	drawn, remaining := draw(count, deckInst.Remaining)
	deckInst.Remaining = *remaining
	return *drawn
}

func (deckInst *DeckInstance) DrawFromBottom(count int) []Card {
	drawn, remaining := drawFromBottom(count, deckInst.Remaining)
	deckInst.Remaining = *remaining
	return *drawn
}

func (deckInst *DeckInstance) DrawRandom(count int) []Card {
	drawn, remaining := drawRandomNonShuffle(count, deckInst.Remaining)
	deckInst.Remaining = *remaining
	return *drawn
}

func (deckInst *DeckInstance) DrawFromList(toDraw []string) []Card {
	drawn, remaining := drawFromList(toDraw, deckInst.Remaining)
	deckInst.Remaining = *remaining
	return *drawn
}

// Pile
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

func (deckInst *DeckInstance) DrawFromPile(count int, pileName string) ([]Card, error) {
	pile, ok := deckInst.Piles[pileName]
	if !ok {
		return nil, fmt.Errorf("Pile not found: %s", pileName)
	}
	drawn, remaining := draw(count, pile)
	deckInst.Piles[pileName] = *remaining
	return *drawn, nil
}

func (deckInst *DeckInstance) DrawFromPileBottom(count int, pileName string) ([]Card, error) {
	pile, ok := deckInst.Piles[pileName]
	if !ok {
		return nil, fmt.Errorf("Pile not found: %s", pileName)
	}
	drawn, remaining := drawFromBottom(count, pile)
	deckInst.Piles[pileName] = *remaining
	return *drawn, nil
}

func (deckInst *DeckInstance) DrawFromPileRandom(count int, pileName string) ([]Card, error) {
	pile, ok := deckInst.Piles[pileName]
	if !ok {
		return nil, fmt.Errorf("Pile not found: %s", pileName)
	}
	drawn, remaining := drawRandomNonShuffle(count, pile)
	deckInst.Piles[pileName] = *remaining
	return *drawn, nil
}

func (deckInst *DeckInstance) DrawFromPileList(toDraw []string, pileName string) ([]Card, error) {
	pile, ok := deckInst.Piles[pileName]
	if !ok {
		return nil, fmt.Errorf("Pile not found: %s", pileName)
	}
	drawn, remaining := drawFromList(toDraw, pile)
	deckInst.Piles[pileName] = *remaining
	return *drawn, nil
}

// BTreeNode
// func (node *BTreeNode) Add(code string, value string) {
func (node *BTreeNode) Add(card *Card) {
	curr := node
	for {
		if curr.Card.Code < card.Code {
			if nil != curr.Right {
				curr = curr.Right
			} else {
				n := BTreeNode{Card: card}
				curr.Right = &n
				return
			}
		} else if curr.Card.Code > card.Code {
			if nil != curr.Left {
				curr = curr.Left
			} else {
				n := BTreeNode{Card: card}
				curr.Left = &n
				return
			}
		}
	}
}

func (node BTreeNode) Find(code string) (*Card, bool) {
	curr := node
	for {
		if curr.Card.Code == code {
			return curr.Card, true
		}
		if curr.Card.Code < code {
			if nil != curr.Right {
				curr = *curr.Right
			} else {
				return nil, false
			}
		} else if curr.Card.Code > code {
			if nil != curr.Left {
				curr = *curr.Left
			} else {
				return nil, false
			}
		}
	}
}

func dumpTree(n *BTreeNode) {
	if nil == n {
		return
	}
	if nil != n.Left {
		dumpTree(n.Left)
	}
	fmt.Printf(" %s", n.Card.Code)
	if nil != n.Right {
		dumpTree(n.Right)
	}
}

func draw(count int, deck []Card) (*[]Card, *[]Card) {
	if len(deck) < count {
		count = len(deck)
	}

	drawn := deck[:count]
	remainder := deck[count:]

	return &drawn, &remainder
}

func drawFromBottom(count int, deck []Card) (*[]Card, *[]Card) {
	start := 0
	if len(deck) < count {
		start = 0
	} else {
		start = len(deck) - count
	}

	drawn := deck[start:]
	remainder := deck[0:start]

	return &drawn, &remainder
}

func drawRandom(count int, deck []Card) (*[]Card, *[]Card) {
	rand.Seed(time.Now().UnixMilli())
	rand.Shuffle(len(deck), func(i, j int) {
		deck[i], deck[j] = deck[j], deck[i]
	})
	return draw(count, deck)
}

func drawRandomNonShuffle(count int, deck []Card) (*[]Card, *[]Card) {
	drawn := make([]Card, 0)
	remainder := deck
	if len(deck) < count {
		count = len(deck)
	}

	for i := 0; i < count; i++ {
		idx := rand.Intn(len(deck))
		drawn = append(drawn, deck[idx])
		remainder = append(remainder[0:idx], remainder[idx+1:]...)
	}

	return &drawn, &remainder
}

func drawFromList(toDraw []string, deck []Card) (*[]Card, *[]Card) {
	drawn := make([]Card, 0)
	remainder := deck
	for _, code := range toDraw {
		for i, c := range remainder {
			if code == c.Code {
				drawn = append(drawn, remainder[i])
				remainder = append(remainder[0:i], remainder[i+1:]...)
				break
			}
		}
	}
	return &drawn, &remainder
}

func codeOnly(msg string, cards []Card) {
	fmt.Printf("> %s: ", msg)
	for _, c := range cards {
		fmt.Printf("%s ", c.Code)
	}
	fmt.Printf("\n")
}
