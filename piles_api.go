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

func mkApiPileGet(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {
	return func(c *gin.Context) {
		deckId := c.Param(PARAM_DECK_ID)
		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		pileName := c.Param(PARAM_PILE_NAME)
		_, ok := deckInstance.Piles[pileName]
		if !ok {
			mkError(http.StatusNotFound, fmt.Sprintf("%s pile in deck %s not found", pileName, deckId), c)
			return
		}

		opt, err := parseRequestOptions(c)

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

		var drawn []deck.Card
		switch from {
		case QUERY_FROM_TOP:
			drawn, err = deckInstance.DrawFromPile(count, pileName)
		case QUERY_FROM_RANDOM:
			drawn, err = deckInstance.DrawFromPileRandom(count, pileName)
		case QUERY_FROM_BOTTOM:
			drawn, err = deckInstance.DrawFromPileBottom(count, pileName)
		case QUERY_FROM_LIST:
			c := strings.Split(strings.TrimSpace(opt.Cards), ",")
			drawn, err = deckInstance.DrawFromPileList(c, pileName)
		}

		if nil != err {
			mkError(http.StatusBadRequest, err.Error(), c)
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"deck_id":     deckInstance.DeckId,
			"shuffled":    deckInstance.Shuffled,
			"replacement": deckInstance.Replacement,
			"remaining":   len(deckInstance.Remaining),
			"piles": gin.H{
				pileName: gin.H{"remaining": len(deckInstance.Piles[pileName])},
			},
			"cards": drawn,
		})
	}
}

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
			"success":     true,
			"deck_id":     deckInstance.DeckId,
			"shuffled":    deckInstance.Shuffled,
			"replacement": deckInstance.Replacement,
			"remaining":   len(deckInstance.Remaining),
			"piles":       piles,
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
			"success":     true,
			"deck_id":     deckInstance.DeckId,
			"shuffled":    deckInstance.Shuffled,
			"replacement": deckInstance.Replacement,
			"remaining":   len(deckInstance.Remaining),
			"piles": gin.H{
				pileName: gin.H{"remaining": len(cards)},
			},
		})
	}
}
