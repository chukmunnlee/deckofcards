package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"

	"github.com/chukmunnlee/deckofcards/deck"
	"github.com/gin-gonic/gin"
)

type CLIOptions struct {
	Port        uint
	DeckRoot    string
	ReleaseMode bool
	EnableCORS  bool
}

type DeckRequestOptions struct {
	// POST /api/deck
	Shuffle       bool   `json:"shuffle"`
	JokersEnabled bool   `json:"jokers_enabled"`
	DeckName      string `json:"deck_name"`
	DeckId        string `json:"deck_id"`
	DeckCount     uint   `json:"deck_count"`

	// GET /api/deck/:deck_id
	Count int `form:"count"`

	// PUT /api/deck/:deck_id?remaining=true
	Remaining bool `form:"remaining"`
}

func parseCLI() CLIOptions {

	port := flag.Uint(OPT_PORT, 3000, "Port to bind to")
	deckRoot := flag.String(OPT_DECK_ROOT, "assets", "Location of the decks")
	releaseMode := flag.Bool(OPT_RELEASE, true, "Disable Gin release mode")
	enableCors := flag.Bool(OPT_ENABLE_CORS, false, "Enable CORS")

	flag.Parse()

	return CLIOptions{
		Port:        *port,
		DeckRoot:    *deckRoot,
		ReleaseMode: *releaseMode,
		EnableCORS:  *enableCors,
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

func parseRequestOptions(c *gin.Context) (*DeckRequestOptions, error) {
	var opt DeckRequestOptions
	if err := c.Bind(&opt); nil != err {
		return nil, err
	}
	return &opt, nil
}

func createDeckByOption(cardDecks deck.CardDecks, opt DeckRequestOptions) (*deck.Deck, error) {

	deckName := DECK_STANDARD_52

	if opt.DeckId != "" {
		return cardDecks.FindDeckById(opt.DeckId)
	} else if opt.DeckName != "" {
		deckName = opt.DeckName
	}

	if DECK_STANDARD_52 == deckName {
		if opt.JokersEnabled {
			deckName = DECK_STANDARD_52_WITH_2_JOKERS
		}
	}

	return cardDecks.FindDeckByName(deckName)
}

func createDeck(cardDecks deck.CardDecks, c *gin.Context) (*deck.Deck, *DeckRequestOptions, error) {

	var err error
	var opt *DeckRequestOptions
	var deck *deck.Deck

	if opt, err = parseRequestOptions(c); nil != err {
		return nil, nil, err
	}

	deck, err = createDeckByOption(cardDecks, *opt)

	return deck, opt, err
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

func registerPOST(endpoint string, handler gin.HandlerFunc, app *gin.Engine) {
	log.Printf("Endpoint: POST %s", endpoint)
	app.POST(endpoint, handler)
	if strings.HasSuffix(endpoint, "/") {
		app.POST(endpoint[:len(endpoint)-1], handler)
	} else {
		app.POST(fmt.Sprintf("%s/", endpoint), handler)
	}
}

func registerGET(endpoint string, handler gin.HandlerFunc, app *gin.Engine) {
	log.Printf("Endpoint: GET %s", endpoint)
	app.GET(endpoint, handler)
	if strings.HasSuffix(endpoint, "/") {
		app.GET(endpoint[:len(endpoint)-1], handler)
	} else {
		app.GET(fmt.Sprintf("%s/", endpoint), handler)
	}
}

func registerPUT(endpoint string, handler gin.HandlerFunc, app *gin.Engine) {
	log.Printf("Endpoint: PUT %s", endpoint)
	app.PUT(endpoint, handler)
	if strings.HasSuffix(endpoint, "/") {
		app.PUT(endpoint[:len(endpoint)-1], handler)
	} else {
		app.PUT(fmt.Sprintf("%s/", endpoint), handler)
	}
}

func registerDELETE(endpoint string, handler gin.HandlerFunc, app *gin.Engine) {
	log.Printf("Endpoint: DELETE %s", endpoint)
	app.DELETE(endpoint, handler)
	if strings.HasSuffix(endpoint, "/") {
		app.DELETE(endpoint[:len(endpoint)-1], handler)
	} else {
		app.DELETE(fmt.Sprintf("%s/", endpoint), handler)
	}
}

func dumpDeck(deckInstance *deck.DeckInstance) {
	fmt.Printf("Deck: %s\n", deckInstance.Name)
	for i := 0; i < len(deckInstance.Remaining); i++ {
		fmt.Printf("%s ", deckInstance.Remaining[i].Code)
	}
	fmt.Println()
}
