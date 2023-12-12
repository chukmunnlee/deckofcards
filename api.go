package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-gonic/gin"
)

func mkApiCheckMethod() func(*gin.Context) {
	return func(c *gin.Context) {
		if !validMethod(c) {
			mkResponseNotImplemented(c)
			return
		}
		c.Next()
	}
}

func mkApiDecks(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	deckMap := cardDecks.GetAllDecks()
	decks := make([]deck.DeckInfo, len(deckMap))
	i := 0
	for _, v := range deckMap {
		decks[i] = deck.DeckInfo{
			Id:          v.Metadata.Id,
			Name:        v.Metadata.Name,
			Description: v.Metadata.Description}
		i++
	}
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"decks":   decks,
		})
	}
}

func mkApiDeckCards(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		_deck, err := cardDecks.FindDeckById(deckId)
		if nil != err {
			_deck, err = cardDecks.FindDeckByName(deckId)
			if nil != err {
				mkError(http.StatusNotFound, err.Error(), c)
				return
			}
		}
		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"id":          _deck.Metadata.Id,
			"name":        _deck.Metadata.Name,
			"description": _deck.Metadata.Description,
			"backImage":   _deck.Spec.BackImage,
			"cards":       _deck.Spec.Cards,
		})
	}
}

func mkApiDeckStatus(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		piles := make([]gin.H, 0)
		for k, v := range deckInstance.Piles {
			piles = append(piles, gin.H{k: gin.H{"remaining": len(v)}})
		}

		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"deck_id":     deckInstance.DeckId,
			"shuffled":    deckInstance.Shuffled,
			"replacement": deckInstance.Replacement,
			"remaining":   len(deckInstance.Remaining),
			"piles":       piles,
		})
	}
}

func mkApiDeckNew(limit uint, cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {

	// TODO: How to consolidate all rand to a single instance
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	hasLimit := limit > 0

	return func(c *gin.Context) {

		if hasLimit {
			if storage.Count() >= int(limit) {
				mkError(http.StatusServiceUnavailable,
					"Exceed the number of decks supported by the server. Try again later", c)
				return
			}
		}

		dk, opt, err := createDeck(cardDecks, c)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		deckCount := uint(1)
		if opt.DeckCount > 0 {
			deckCount = opt.DeckCount
		}

		var deckInstance *deck.DeckInstance
		if len(strings.TrimSpace(opt.Cards)) > 0 {
			deckInstance = dk.CreateCustomInstance(opt.Cards, deckCount)
		} else {
			deckInstance = dk.CreateInstance(deckCount)
		}
		deckInstance.Shuffled = opt.Shuffle
		deckInstance.Replacement = opt.Replacement

		if opt.Shuffle {
			shuffleDeck(&deckInstance.Remaining, r)
		}

		if err := storage.Add(deckInstance); nil != err {
			mkError(http.StatusBadRequest, err.Error(), c)
			return
		}

		dumpDeck(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"deck_id":     deckInstance.DeckId,
			"shuffled":    deckInstance.Shuffled,
			"replacement": deckInstance.Replacement,
			"remaining":   len(deckInstance.Remaining),
		})
	}
}

func mkApiDeckDraw(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	return func(c *gin.Context) {
		opt, err := parseRequestOptions(c)
		if nil != err {
			mkError(http.StatusBadRequest, err.Error(), c)
			return
		}

		var from string
		count := 1
		if "" != opt.Cards {
			from = QUERY_FROM_LIST
		} else {
			from = QUERY_FROM_TOP
			if "" != opt.From {
				from = opt.From
			}

			if (QUERY_FROM_TOP != from) && (QUERY_FROM_BOTTOM != from) && (QUERY_FROM_RANDOM != from) {
				mkError(http.StatusBadRequest, fmt.Sprint("Unknown from value. One of bottom, random"), c)
				return
			}
			if opt.Count > 0 {
				count = opt.Count
			}
		}

		deckId := c.Param(PARAM_DECK_ID)

		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		_deck, _ := cardDecks.FindDeckById(deckInstance.Id)
		drawn := make([]deck.Card, 0)
		if QUERY_FROM_LIST == from {
			c := strings.Split(strings.TrimSpace(opt.Cards), ",")
			drawn = deckInstance.DrawFromList(c)
			if deckInstance.Replacement {
				deckInstance.Remaining = cloneDeck(*_deck, deckInstance.Count, deckInstance.Shuffled, r)
			}

		} else {
			for i := 0; i < count; i++ {
				var d []deck.Card
				switch from {
				case QUERY_FROM_TOP:
					d = deckInstance.Draw(1)
				case QUERY_FROM_RANDOM:
					d = deckInstance.DrawRandom(1)
				case QUERY_FROM_BOTTOM:
					d = deckInstance.DrawFromBottom(1)
				}
				drawn = append(drawn, d...)

				if deckInstance.Replacement {
					deckInstance.Remaining = cloneDeck(*_deck, deckInstance.Count, deckInstance.Shuffled, r)
				}
			}
		}

		// Add to discarded pile
		deckInstance.AddToPile(drawn, deck.PILE_DISCARDED)

		storage.Update(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"deck_id":     deckInstance.DeckId,
			"cards":       drawn,
			"shuffled":    deckInstance.Shuffled,
			"replacement": deckInstance.Replacement,
			"remaining":   len(deckInstance.Remaining),
		})
	}
}

func mkApiDeckBack(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}
		deck, err := cardDecks.FindDeckById(deckInstance.Id)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":    true,
			"back_image": deck.Spec.BackImage,
		})
	}
}

func mkApiDeckDelete(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		if !storage.HasDeck(deckId) {
			mkError(http.StatusNotFound, fmt.Sprintf("Cannot find deck_id %s", deckId), c)
			return
		}

		storage.Delete(deckId)
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"deck_id": deckId,
		})
	}
}

func mkApiDeckPut(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		if !storage.HasDeck(deckId) {
			mkError(http.StatusNotFound, fmt.Sprintf("Cannot find deck_id %s", deckId), c)
			return
		}

		deckInstance, _ := storage.Get(deckId)
		opt, _ := parseRequestOptions(c)

		var cards []deck.Card

		if opt.Remaining {
			cards = deckInstance.Remaining
			if deckInstance.Shuffled {
				shuffleDeck(&cards, r)
			}
		} else {
			_d, _ := cardDecks.FindDeckById(deckInstance.Id)
			cards = cloneDeck(*_d, deckInstance.Count, deckInstance.Shuffled, r)
			// Since we are recreating the deck, we reinitialize the Piles
			deckInstance.Piles = make(map[string][]deck.Card)
			deckInstance.Piles[deck.PILE_DISCARDED] = make([]deck.Card, 0)
		}

		deckInstance.Remaining = cards

		storage.Update(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"deck_id":     deckInstance.DeckId,
			"shuffled":    deckInstance.Shuffled,
			"replacement": deckInstance.Replacement,
			"remaining":   len(deckInstance.Remaining),
		})
	}
}

func mkApiDeckGetContents(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		if !storage.HasDeck(deckId) {
			mkError(http.StatusNotFound, fmt.Sprintf("Cannot find deck_id %s", deckId), c)
			return
		}

		deckInstance, _ := storage.Get(deckId)

		pileName := c.Param(PARAM_PILE_NAME)
		if "" != pileName {
			cards, ok := deckInstance.Piles[pileName]
			if !ok {
				mkError(http.StatusNotFound, fmt.Sprintf("Cannot find pile %s", pileName), c)
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"success":     true,
				"deck_id":     deckInstance.DeckId,
				"shuffled":    deckInstance.Shuffled,
				"replacement": deckInstance.Replacement,
				"remaining":   len(deckInstance.Remaining),
				"piles": gin.H{
					pileName: gin.H{
						"remaining": len(cards),
						"cards":     cards,
					},
				},
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"deck_id":     deckInstance.DeckId,
			"shuffled":    deckInstance.Shuffled,
			"replacement": deckInstance.Replacement,
			"remaining":   len(deckInstance.Remaining),
			"cards":       deckInstance.Remaining,
		})
	}
}

func mkApiDeckPatch(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	return func(c *gin.Context) {

		opt, _ := parseRequestOptions(c)

		deckId := c.Param(PARAM_DECK_ID)
		if !storage.HasDeck(deckId) {
			mkError(http.StatusNotFound, fmt.Sprintf("Cannot find deck_id %s", deckId), c)
			return
		}

		deckInstance, _ := storage.Get(deckId)

		pileName := c.Param(PARAM_PILE_NAME)
		fromPile := "" != pileName

		de, _ := cardDecks.FindDeckById(deckInstance.Id)
		var currCards []deck.Card
		var toAdd []deck.Card
		var err error

		if len(opt.Cards) <= 0 {
			mkError(http.StatusBadRequest, "Missing cards to add to pile", c)
			return
		}

		toAdd, err = findCardsFromDeck(opt.Cards, *de, opt.Strict)
		if nil != err {
			mkError(http.StatusBadRequest, err.Error(), c)
			return
		}

		currCards = []deck.Card{}
		if fromPile {
			cards, ok := deckInstance.Piles[pileName]
			if ok {
				currCards = cards
			} else {
				currCards = make([]deck.Card, 0)
			}
		} else {
			currCards = deckInstance.Remaining
		}

		// Append the cards to the current pile
		currCards = append(currCards, toAdd...)

		/*
			if fromPile {
				// Return all cards from pile to main deck
				cards, ok := deckInstance.Piles[pileName]
				if !ok {
					mkError(http.StatusBadRequest,
						fmt.Sprintf("Cannot find %s pile to return to main deck", pileName), c)
					return
				}
				toAdd = cards
				// Clear the pile
				deckInstance.Piles[pileName] = make([]deck.Card, 0)
				currCards = deckInstance.Remaining
				// return back to the current pile
				fromPile = false
			} else {
				mkError(http.StatusBadRequest, "Cannot return the main deck to itself", c)
				return
			}

			currCards = append(currCards, toAdd...)
			//if opt.FShuffle {
		*/
		if opt.Shuffle {
			shuffleDeck(&currCards, r)
		}

		if fromPile {
			deckInstance.Piles[pileName] = currCards
		} else {
			deckInstance.Remaining = currCards
		}

		storage.Update(deckInstance)

		if fromPile {
			deckInstance.Piles[pileName] = currCards
			c.JSON(http.StatusOK, gin.H{
				"success":     true,
				"deck_id":     deckInstance.DeckId,
				"shuffled":    opt.Shuffle,
				"remaining":   len(deckInstance.Remaining),
				"replacement": deckInstance.Replacement,
				"piles": gin.H{
					pileName: gin.H{
						"remaining": len(currCards),
					},
				},
			})
		} else {
			deckInstance.Remaining = currCards
			c.JSON(http.StatusOK, gin.H{
				"success":     true,
				"deck_id":     deckInstance.DeckId,
				"shuffled":    opt.Shuffle,
				"replacement": deckInstance.Replacement,
				"remaining":   len(deckInstance.Remaining),
			})
		}
	}
}
