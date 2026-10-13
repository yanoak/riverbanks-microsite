#!/usr/bin/env bash
# Turn the comic's web-edition PDF into the reader's page images.
#
#   scripts/comic-pages.sh "~/Downloads/Compilation Lo Res — Riverbanks.pdf"
#
# Writes static/comic/NN-1600.webp and NN-800.webp for every page, replacing the previous
# edition, and src/lib/comic/pages.json with the page count, aspect ratio and a short hash of
# the PDF (the reader puts it on image URLs, so a new edition is never served from cache).
# Export the PDF from the editor with its watermark off; the site draws its own.
# Needs pdftoppm (poppler), cwebp and magick. A 47-page A1 PDF takes about 7 minutes.
set -euo pipefail

pdf=${1:?usage: comic-pages.sh <edition.pdf>}
[[ -f $pdf ]] || { echo "no such file: $pdf" >&2; exit 1; }

root=$(cd "$(dirname "$0")/.." && pwd)
out=$root/static/comic
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# 1600 px across a page: the width the generator's web edition sizes its images for.
pdftoppm -png -scale-to-x 1600 -scale-to-y -1 "$pdf" "$work/p"

rm -rf "$out"
mkdir -p "$out"
n=0
for png in "$work"/p-*.png; do
	n=$((n + 1))
	num=$(printf '%02d' "$n")
	cwebp -quiet -q 80 "$png" -o "$out/$num-1600.webp"
	cwebp -quiet -q 78 -resize 800 0 "$png" -o "$out/$num-800.webp"
done

first=$(ls "$work"/p-*.png | head -1)
read -r w h < <(magick identify -format '%w %h\n' "$first")
hash=$(shasum -a 256 "$pdf" | cut -c1-10)

cat >"$root/src/lib/comic/pages.json" <<JSON
{
	"count": $n,
	"width": $w,
	"height": $h,
	"version": "$hash",
	"source": "$(basename "$pdf")"
}
JSON

echo "$n pages → static/comic ($(du -sh "$out" | cut -f1)), version $hash"
