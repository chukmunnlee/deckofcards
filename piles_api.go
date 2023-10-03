package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-gonic/gin"
)

func mkApiPilesPost(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)

		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		opt, err := parseRequestOptions(c)

		if (nil != err) || (nil == opt) || (len(opt.Piles) <= 0) {
			mkError(http.StatusBadRequest, "Missing pile names", c)
			return
		}

		createdPiles := make([]string, 0)
		for _, pileName := range opt.Piles {
			ok := deckInstance.CreatePile(pileName)
			if ok {
				createdPiles = append(createdPiles, fmt.Sprintf("+%s", pileName))
			} else {
				createdPiles = append(createdPiles, fmt.Sprintf("=%s", pileName))
			}
		}
		storage.Update(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"deck_id": deckInstance.DeckId,
			"piles":   createdPiles,
		})
	}
}

func mkApiPilesGet(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		piles := deckInstance.GetPiles()

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"deck_id":   deckInstance.DeckId,
			"shuffled":  deckInstance.Shuffled,
			"remaining": len(deckInstance.Remaining),
			"piles":     piles,
		})

	}
}

func mkApiPilePut(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		pileName := c.Param(PARAM_PILE_NAME)
		cards, ok := deckInstance.Piles[pileName]
		if !ok {
			mkError(http.StatusNotFound, fmt.Sprintf("%s pile in deck %s not found", pileName, deckId), c)
			return
		}

		shuffleDeck(&cards, r)
		deckInstance.Piles[pileName] = cards
		storage.Update(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"deck_id":   deckInstance.DeckId,
			"shuffled":  deckInstance.Shuffled,
			"remaining": len(deckInstance.Remaining),
			"piles": gin.H{
				pileName: gin.H{"remaining": len(cards)},
			},
		})
	}
}
