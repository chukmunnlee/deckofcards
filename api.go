package main

import (
	"fmt"
	"math/rand"
	"net/http"
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

func mkApiDeck(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"deck_id":   deckInstance.DeckId,
			"shuffled":  deckInstance.Shuffled,
			"remaining": len(deckInstance.Remaining),
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

		deck, opt, err := createDeck(cardDecks, c)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		deckCount := uint(1)
		if opt.DeckCount > 0 {
			deckCount = opt.DeckCount
		}

		deckInstance := deck.CreateInstance(deckCount)
		deckInstance.Shuffled = opt.Shuffle

		if opt.Shuffle {
			shuffleDeck(&deckInstance.Remaining, r)
		}

		if err := storage.Add(deckInstance); nil != err {
			mkError(http.StatusBadRequest, err.Error(), c)
			return
		}

		dumpDeck(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"deck_id":   deckInstance.DeckId,
			"shuffled":  deckInstance.Shuffled,
			"remaining": len(deckInstance.Remaining),
		})
	}
}

func mkApiDeckDraw(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		opt, err := parseRequestOptions(c)
		if nil != err {
			mkError(http.StatusBadRequest, err.Error(), c)
			return
		}

		count := 1
		if opt.Count > 0 {
			count = opt.Count
		}

		deckId := c.Param(PARAM_DECK_ID)

		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		drawn := deckInstance.Draw(count, deck.PILE_DISCARDED)
		storage.Update(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"deck_id":   deckInstance.DeckId,
			"cards":     drawn,
			"shuffled":  deckInstance.Shuffled,
			"remaining": len(deckInstance.Remaining),
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

		// Can cache the back image
		c.Header("Cache-Control", "public")
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
		} else {
			opts := DeckRequestOptions{
				DeckId:   deckInstance.Id,
				DeckName: deckInstance.Name,
				Shuffle:  deckInstance.Shuffled,
			}
			deck, err := createDeckByOption(cardDecks, opts)
			if nil != err {
				mkError(http.StatusBadRequest, fmt.Sprintf("Cannot created new deck for %s", deckId), c)
				return
			}
			cards = (deck.CreateInstance(deckInstance.Count)).Remaining
		}

		shuffleDeck(&cards, r)
		deckInstance.Remaining = cards

		storage.Update(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"deck_id":   deckInstance.DeckId,
			"shuffled":  deckInstance.Shuffled,
			"remaining": len(deckInstance.Remaining),
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
				"success":   true,
				"deck_id":   deckInstance.DeckId,
				"shuffled":  deckInstance.Shuffled,
				"remaining": len(deckInstance.Remaining),
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
			"success":   true,
			"deck_id":   deckInstance.DeckId,
			"shuffled":  deckInstance.Shuffled,
			"remaining": len(deckInstance.Remaining),
			"cards":     deckInstance.Remaining,
		})
	}
}
