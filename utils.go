package main

import "flag"

type CLIOptions struct {
	port uint
}

func parseCLI() CLIOptions {

	port := flag.Uint("port", 3000, "Port to bind to")

	return CLIOptions{
		port: *port,
	}
}
