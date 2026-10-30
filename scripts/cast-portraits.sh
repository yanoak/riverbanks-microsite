#!/usr/bin/env bash
# The cast page's portraits and link card.
#
#   scripts/cast-portraits.sh
#
# Copies each speaking character's portrait from the story network's public bucket (Supabase,
# network-portraits/riverbook/<cast member id>; the generator publishes them when the network is
# saved) into static/cast/<id>.webp: head and shoulders, square, 400 px. The network portraits
# are turnaround sheets (three full-body views side by side); the crop finds the middle, front
# view's outline and takes a square from its top. Taro has no network portrait, so hers comes
# from her reference sheet in art/taro/refs (gitignored: keep a local copy). Then composes
# static/cast/card.jpg, the page's 1200×630 link card. Needs curl and magick.
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
out=$root/static/cast
bucket=https://krugthurasfvthjtchqo.supabase.co/storage/v1/object/public/network-portraits/riverbook
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# id, then the cast member id of the chosen portrait (the age of their main appearance).
portraits=(
	"darya b942243d-f052-4fe6-b164-2ffc68681713"   # the banker
	"nusa 9dae39b7-7a00-4b5d-bd43-b28040b4d054"    # the Summit speaker
	"ismahan 3a2a3743-ce51-436f-a862-9278eebdcac6" # at 18
	"sultan-nuh 2f61dc49-3b3c-48fa-b007-3ade1e1e2e9a"
	"hamzah 401ce03e-2228-4ec7-9eab-feb88b0ae833"  # the General
	"faris 97aca396-7876-4c0f-a6c7-0bc8f8fe0062"   # the Financier
	"dew 6c547506-9627-4456-b1fa-80ef0cc34af6"
	"ya 3f05d693-1727-44f8-b913-b28768a235db"      # at 20
	"jalal d73d4f39-8b11-4fa0-86b9-2bf11bbe072c"
	"shapla b8bf230b-1072-412f-a709-61d1ac15d4d5"
	"teja 244877d8-1514-4cdd-b9dc-5221e1e8518a"    # at 11
	"biret 5c3c0be9-7b75-49ca-9a8f-be6731d23424"
)

mkdir -p "$out"
for entry in "${portraits[@]}"; do
	read -r id member <<<"$entry"
	curl -sSf -o "$work/$id" "$bucket/$member"
	read -r sw sh <<<"$(magick identify -format '%w %h' "$work/$id")"
	col=$((sw / 3))
	# The front view's outline in the middle third: w x h + left + top.
	box=$(magick "$work/$id" -crop "${col}x${sh}+${col}+0" +repage -fuzz 12% -format '%@' info:)
	IFS='x+' read -r bw bh bx by <<<"$box"
	size=$((bh * 37 / 100))
	# A box as wide as the column has caught a side view's edge: centre on the column instead.
	if ((bw > col * 3 / 4)); then cx=$((col + col / 2)); else cx=$((col + bx + bw / 2)); fi
	top=$((by > 30 ? by - 30 : 0))
	magick "$work/$id" -crop "${size}x${size}+$((cx - size / 2))+${top}" +repage \
		-resize 400x400 -quality 82 "$out/$id.webp"
done
# Taro's sheet is one view on white: her head and chest, with the white around her turned to the
# others' paper (a flood fill from the corners, so her white fur stays).
magick "$root/art/taro/refs/taro-cat-front.png" -background '#f3ecdc' -flatten -fuzz 4% -fill '#f3ecdc' \
	-draw 'color 0,0 floodfill' -draw 'color 2091,0 floodfill' \
	-crop 760x760+666+520 +repage -resize 400x400 -quality 82 "$out/taro.webp"

# The link card: the portraits in two rows on paper.
order=(darya nusa ismahan sultan-nuh hamzah faris dew ya taro jalal shapla teja biret)
tiles=()
for id in "${order[@]}"; do
	magick "$out/$id.webp" -resize 150x150 \( -size 150x150 xc:none -fill white -draw 'circle 75,75 75,2' \) \
		-alpha set -compose DstIn -composite "$work/tile-$id.png"
	tiles+=("$work/tile-$id.png")
done
magick montage "${tiles[@]}" -tile 7x2 -geometry +8+8 -background none "$work/grid.png"
magick -size 1200x630 xc:'#f3ecdc' "$work/grid.png" -gravity center -composite -quality 84 "$out/card.jpg"

echo "$(ls "$out"/*.webp | wc -l | tr -d ' ') portraits and card.jpg → static/cast ($(du -sh "$out" | cut -f1))"
