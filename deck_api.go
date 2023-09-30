package main

import (
	"fmt"
	"net/http"

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
