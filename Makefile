.PHONY: run out shots

# Play the game locally in a browser.
run:
	node serve.ts

# Build the hand-in (game/ + screenshots/ + dossier.json) into out/.
out:
	mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

# Re-take the entry screenshots with the headless browser tooling.
shots:
	node tools/take-shots.mjs
