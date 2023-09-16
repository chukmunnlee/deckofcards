package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

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

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	return func(c *gin.Context) {

		if !validMethod(c) {
			mkResponseNotImplemented(c)
			return
		}

		deck, err := getDeck(cardDecks, c)
		if nil != err {
			mkError(http.StatusBadRequest, err.Error(), c)
			return
		}

		deckCount := 1
		if hasField(PARAM_DECK_COUNT, c) {
			tmp, _ := readField(PARAM_DECK_COUNT, "1", c)
			deckCount, _ = strconv.Atoi(tmp)
		}

		deckInstance := deck.CreateInstance(uint(deckCount))
		shuffled := strings.HasSuffix(c.Request.URL.Path, "/shuffle") ||
			strings.HasSuffix(c.Request.URL.Path, "/shuffle/")

		if shuffled {
			shuffleDeck(&deckInstance.Remaining, r)
		}

		dumpDeck(deckInstance)

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"deck_id":   deckInstance.Id,
			"shuffled":  shuffled,
			"remaining": len(deckInstance.Remaining),
		})
	}
}

func validMethod(c *gin.Context) bool {
	m := c.Request.Method
	return (m == "GET") || ("POST" == m)
}

func shuffleDeck(cards *[]deck.Card, r *rand.Rand) {
	for i := 0; i < 5; i++ {
		r.Shuffle(len(*cards), func(i, j int) {
			(*cards)[i], (*cards)[j] = (*cards)[j], (*cards)[i]
		})
	}
}

func getDeck(cardDecks deck.CardDecks, c *gin.Context) (*deck.Deck, error) {

	var err error
	var deck *deck.Deck

	deckName := DECK_STANDARD_52
	hasDeckName := hasField(PARAM_DECK_NAME, c)
	hasDeckId := hasField(PARAM_DECK_ID, c)

	if hasDeckId {
		deckId, _ := readField(PARAM_DECK_ID, "", c)
		if deck, err = cardDecks.FindDeckById(deckId); nil != err {
			return nil, err
		}
		deckName = deck.Metadata.Name
	} else if hasDeckName {
		deckName, err = readField(PARAM_DECK_NAME, "", c)
		if nil != err {
			return nil, err
		}
	}

	if DECK_STANDARD_52 == deckName {
		tmp, _ := readField(PARAM_JOKERS_ENABLED, "false", c)
		if b, _ := strconv.ParseBool(tmp); b {
			deckName = DECK_STANDARD_52_WITH_2_JOKERS
		}
	}

	deck, err = cardDecks.FindDeckByName(deckName)
	if nil != err {
		return nil, err
	}

	return deck, nil
}

func hasField(field string, c *gin.Context) bool {
	return c.Query(field) != ""
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
	if strings.HasSuffix(endpoint, "/") {
		app.GET(endpoint[:len(endpoint)-1], handler)
		app.POST(endpoint[:len(endpoint)-1], handler)
	} else {
		app.GET(fmt.Sprintf("%s/", endpoint), handler)
		app.POST(fmt.Sprintf("%s/", endpoint), handler)
	}
}

func dumpDeck(deckInstance *deck.DeckInstance) {
	fmt.Printf("Deck: %s\n", deckInstance.Name)
	for i := 0; i < len(deckInstance.Remaining); i++ {
		fmt.Printf("%s ", deckInstance.Remaining[i].Code)
	}
	fmt.Println()
}
