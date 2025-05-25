#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

cleanup() {
  rm -rf "$TMPDIR"
}

trap cleanup EXIT

TMPDIR=$(mktemp -d)

tilesets_16px=(core_indoor_floors.png core_indoor_walls.png)

for file in "${tilesets_16px[@]}"; do
	dir=assets/tilesets
	mkdir -p $TMPDIR/$dir
	tile-extruder -w 16 -h 16 -i $dir/$file -o $TMPDIR/$dir/$file
	scalex -k 2 $TMPDIR/$dir/$file public/$dir/$file
done

