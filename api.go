package main

import (
	"log"
	"net/http"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-gonic/gin"
)

func mkApiDecks(deckMap map[string]*deck.Deck) func(*gin.Context) {
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

func register(endpoint string, handler gin.HandlerFunc, app *gin.Engine) {
	log.Printf("Endpoint: %s", endpoint)
	app.GET(endpoint, handler)
	app.POST(endpoint, handler)
}
