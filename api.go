package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-gonic/gin"
)

func mkApiDecks(cardDecks deck.CardDecks) func(*gin.Context) {
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

func mkApiDeckNew(cardDecks deck.CardDecks) func(*gin.Context) {

	return func(c *gin.Context) {
		jokers, err := readField("jokers_enabled", "false", c)
		if nil != err {
			mkResponseNotImplemented(c)
			return
		}

		boolVal, err := strconv.ParseBool(jokers)
		if nil != err {
			boolVal = false
		}
		deckName, _ := readField("deck_name", "", c)
		if "" == deckName {
			if boolVal {
				deckName = "Standard52DeckWith2Jokers"
			} else {
				deckName = "Standard52Deck"
			}
		}

		deck, err := cardDecks.FindDeckByName(deckName)
		if nil != err {
			mkError(http.StatusBadRequest, fmt.Sprintf("No such deck: %s", deckName), c)
			return
		}

		deckInstance := deck.CreateInstance(1)

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"deck_id":   deckInstance.Id,
			"shuffled":  false,
			"remaining": len(deckInstance.Remaining),
		})
	}
}

func readField(field string, defValue string, c *gin.Context) (string, error) {
	switch m := c.Request.Method; m {
	case "GET":
		return c.DefaultQuery(field, defValue), nil
	case "POST":
		return c.DefaultPostForm(field, defValue), nil
	default:
		return "", fmt.Errorf("Method %s not implmented for %s", c.Request.Method, c.Request.URL.Path)
	}
}

func mkError(status int, msg string, c *gin.Context) {
	c.JSON(status, gin.H{"error": msg})
}

func mkResponseNotImplemented(c *gin.Context) {
	c.JSON(http.StatusNotImplemented,
		gin.H{"error": fmt.Sprintf("Method %s not implmented for %s", c.Request.Method, c.Request.URL.Path)})
}

func register(endpoint string, handler gin.HandlerFunc, app *gin.Engine) {
	log.Printf("Endpoint: %s", endpoint)
	app.GET(endpoint, handler)
	app.POST(endpoint, handler)
}
