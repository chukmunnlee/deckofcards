package main

import "flag"

type CLIOptions struct {
	Port     uint
	DeckRoot string
}

func parseCLI() CLIOptions {

	port := flag.Uint("port", 3000, "Port to bind to")
	deckRoot := flag.String("deckRoot", "assets", "Location of the decks")

	flag.Parse()

	return CLIOptions{
		Port:     *port,
		DeckRoot: *deckRoot,
	}
}
