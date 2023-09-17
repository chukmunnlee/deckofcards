package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-gonic/gin"
)

type CLIOptions struct {
	Port        uint
	DeckRoot    string
	ReleaseMode bool
}

func parseCLI() CLIOptions {

	port := flag.Uint(OPT_PORT, 3000, "Port to bind to")
	deckRoot := flag.String(OPT_DECK_ROOT, "assets", "Location of the decks")
	releaseMode := flag.Bool(OPT_RELEASE, true, "Disable Gin release mode")

	flag.Parse()

	return CLIOptions{
		Port:        *port,
		DeckRoot:    *deckRoot,
		ReleaseMode: *releaseMode,
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
	hasDeckName := hasField(QUERY_DECK_NAME, c)
	hasDeckId := hasField(QUERY_DECK_ID, c)

	if hasDeckId {
		deckId, _ := readField(QUERY_DECK_ID, "", c)
		if deck, err = cardDecks.FindDeckById(deckId); nil != err {
			return nil, err
		}
		deckName = deck.Metadata.Name
	} else if hasDeckName {
		deckName, _ = readField(QUERY_DECK_NAME, "", c)
	}

	if DECK_STANDARD_52 == deckName {
		tmp, _ := readField(QUERY_JOKERS_ENABLED, "false", c)
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
	c.JSON(status, gin.H{"success": false, "error": msg})
}

func mkResponseNotImplemented(c *gin.Context) {
	c.JSON(http.StatusNotImplemented,
		gin.H{
			"success": false,
			"error":   fmt.Sprintf("Method %s not implmented for %s", c.Request.Method, c.Request.URL.Path),
		})
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
