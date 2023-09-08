package main

import "flag"

type CLIOptions struct {
	Port        uint
	DeckRoot    string
	ReleaseMode bool
}

func parseCLI() CLIOptions {

	port := flag.Uint("port", 3000, "Port to bind to")
	deckRoot := flag.String("deckRoot", "assets", "Location of the decks")
	releaseMode := flag.Bool("release", true, "Disable Gin release mode")

	flag.Parse()

	return CLIOptions{
		Port:        *port,
		DeckRoot:    *deckRoot,
		ReleaseMode: *releaseMode,
	}
}
