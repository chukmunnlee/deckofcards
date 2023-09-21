package main

import (
	"math/rand"
	"net/http"
	"strconv"
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
		c.JSON(http.StatusOK, decks)
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

func mkApiDeckNew(cardDecks deck.CardDecks, storage *deck.DeckStorage) func(*gin.Context) {

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	return func(c *gin.Context) {

		deck, err := createDeck(cardDecks, c)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		deckCount := 1
		if hasField(QUERY_DECK_COUNT, c) {
			tmp, _ := readField(QUERY_DECK_COUNT, "1", c)
			deckCount, _ = strconv.Atoi(tmp)
		}

		deckInstance := deck.CreateInstance(uint(deckCount))
		shuffled := strings.HasSuffix(c.Request.URL.Path, "/shuffle") ||
			strings.HasSuffix(c.Request.URL.Path, "/shuffle/")
		deckInstance.Shuffled = shuffled

		if shuffled {
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
		tmp, _ := readField(QUERY_COUNT, "1", c)
		count, err := strconv.Atoi(tmp)
		if nil != err {
			mkError(http.StatusBadRequest, err.Error(), c)
			return
		}
		deckId := c.Param(PARAM_DECK_ID)

		deckInstance, err := storage.Get(deckId)
		if nil != err {
			mkError(http.StatusNotFound, err.Error(), c)
			return
		}

		drawn := deckInstance.Draw(count, deck.PILE_DISCARD)
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
