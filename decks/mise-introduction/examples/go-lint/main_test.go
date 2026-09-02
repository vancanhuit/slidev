package main

import "testing"

func TestGreeting(t *testing.T) {
	if got := greeting("mise"); got != "Hello, mise!" {
		t.Fatalf("greeting() = %q", got)
	}
}
