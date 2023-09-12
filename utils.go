package main

import "flag"

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
