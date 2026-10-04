#!/usr/bin/env bash
# Encode rendered Taro clips (art/taro/out/<clip>/frame_####.png) into transparent video:
#   art/taro/clips/<clip>.webm  VP9 with alpha (Chrome, Firefox, Android)
#   art/taro/clips/<clip>.mp4   HEVC with alpha (Safari, iOS)
# Usage: art/taro/encode.sh [clip ...]   (default: every clip in out/)
#
# The HEVC goes PNG → ProRes 4444 → Apple's avconvert, writing the .mp4 directly. Both shortcuts
# tried first gave files Safari refuses with "Media failed to decode": ffmpeg's
# hevc_videotoolbox with alpha (on this Intel Mac), and remuxing a good .mov to .mp4 with
# ffmpeg. Every HEVC file is decoded with AVFoundation afterwards (check-alpha.swift) so a bad
# one fails here, not in Safari.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$here/clips"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
swiftc -O "$here/check-alpha.swift" -o "$tmp/check-alpha" 2>/dev/null
clips=("$@")
[ ${#clips[@]} -eq 0 ] && clips=($(ls "$here/out"))
for clip in "${clips[@]}"; do
  src="$here/out/$clip/frame_%04d.png"
  ffmpeg -loglevel error -y -framerate 24 -i "$src" \
    -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -row-mt 1 \
    "$here/clips/$clip.webm"
  ffmpeg -loglevel error -y -framerate 24 -i "$src" \
    -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le -alpha_bits 16 "$tmp/$clip.mov"
  avconvert --source "$tmp/$clip.mov" --output "$here/clips/$clip.mp4" \
    --preset PresetHEVCHighestQualityWithAlpha --replace >/dev/null 2>&1
  check="$("$tmp/check-alpha" "$here/clips/$clip.mp4" | tail -1)"
  case "$check" in
    frame*) ;;
    *) echo "$clip.mp4 does not decode with AVFoundation: $check" >&2; exit 1 ;;
  esac
  echo "$clip: $(du -h "$here/clips/$clip.webm" | cut -f1) webm, $(du -h "$here/clips/$clip.mp4" | cut -f1) mp4 · $check"
done
