#!/usr/bin/env bash
# Encode rendered Taro clips (art/taro/out/<clip>/frame_####.png) into transparent video:
#   art/taro/clips/<clip>.webm  VP9 with alpha (Chrome, Firefox, Android)
#   art/taro/clips/<clip>.mp4   HEVC with alpha (Safari, iOS), via VideoToolbox
# Usage: art/taro/encode.sh [clip ...]   (default: every clip in out/)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$here/clips"
clips=("$@")
[ ${#clips[@]} -eq 0 ] && clips=($(ls "$here/out"))
for clip in "${clips[@]}"; do
  src="$here/out/$clip/frame_%04d.png"
  ffmpeg -loglevel error -y -framerate 24 -i "$src" \
    -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -row-mt 1 \
    "$here/clips/$clip.webm"
  # HEVC alpha needs VideoToolbox; artifacts and some hosts don't serve .mov, so remux to .mp4.
  tmp="$(mktemp -d)/$clip.mov"
  ffmpeg -loglevel error -y -framerate 24 -i "$src" \
    -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 0.75 -b:v 1500k -pix_fmt bgra \
    -tag:v hvc1 "$tmp"
  ffmpeg -loglevel error -y -i "$tmp" -c copy -tag:v hvc1 -movflags +faststart \
    "$here/clips/$clip.mp4"
  echo "$clip: $(du -h "$here/clips/$clip.webm" | cut -f1) webm, $(du -h "$here/clips/$clip.mp4" | cut -f1) mp4"
done
