package deck

import (
	"fmt"
	"time"
)

type DeckEntry struct {
	DeckId    string
	Instance  DeckInstance
	CreatedOn time.Time
	UpdatedOn time.Time
}

type DeckStorage struct {
	entries map[string]DeckEntry
}

type DeckOperations interface {
	Init(config map[string]string)
	Get(deckId string) (*DeckInstance, error)
	Add(deckInst DeckInstance) error
	Update(deckInst DeckInstance) error
	Delete(deckId string)
	HasDeck(deckId string) bool
}

func (ds *DeckStorage) Init(config map[string]string) {
	ds.entries = make(map[string]DeckEntry)
}

func (ds *DeckStorage) Get(deckId string) (*DeckInstance, error) {

	entry, exists := ds.entries[deckId]
	if !exists {
		return nil, fmt.Errorf("Cannot find deckId %s", deckId)
	}

	return &entry.Instance, nil
}

func (ds *DeckStorage) Add(deckInst *DeckInstance) error {

	if ds.HasDeck(deckInst.DeckId) {
		return fmt.Errorf("Deck id %s exists", deckInst.DeckId)
	}

	entry := DeckEntry{
		DeckId:    deckInst.DeckId,
		Instance:  *deckInst,
		CreatedOn: time.Now(),
		UpdatedOn: time.Now(),
	}
	ds.entries[deckInst.DeckId] = entry

	return nil
}

func (ds *DeckStorage) Update(deckInst *DeckInstance) error {
	entry, exists := ds.entries[deckInst.DeckId]
	if !exists {
		return fmt.Errorf("Deck id %s does exists", deckInst.Id)
	}

	entry.UpdatedOn = time.Now()
	entry.Instance = *deckInst
	ds.entries[deckInst.DeckId] = entry

	return nil
}

func (ds *DeckStorage) Delete(deckId string) {
	delete(ds.entries, deckId)
}

func (ds DeckStorage) HasDeck(deckId string) bool {
	_, ex := ds.entries[deckId]
	return ex
}
