#!/usr/bin/env bash
# Renders the blank-sheet asset from tools/make-blank-sheet.html.
#
# The sheet is drawn on a canvas the size of the paper and the page holds
# nothing else, so a headless screenshot at that window size is the sheet itself,
# pixel for pixel. Chrome, Chromium or Edge will all do — the imprint is text, so
# whichever one renders it has to have Arial or a metric-compatible substitute.
#
#   tools/make-blank-sheet.sh                      # portrait, the shipped asset
#   tools/make-blank-sheet.sh landscape            # the sideways sheet
#
# Writes clarknova.nosocial.net/paper/blank-<orientation>.png.
set -euo pipefail

cd "$(dirname "$0")/.."
orientation="${1:-portrait}"
case "$orientation" in
  portrait)  w=2480; h=3508 ;;
  landscape) w=3508; h=2480 ;;
  *) echo "usage: $0 [portrait|landscape]" >&2; exit 2 ;;
esac

out="clarknova.nosocial.net/paper/blank-$orientation.png"
# A Windows browser is handed Windows paths, in the file:// URL as much as in
# --screenshot: given /c/Users/... it loads nothing and writes nothing, and says
# so nowhere.
winpath() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else printf '%s' "$1"; fi; }
src="$(winpath "$PWD/tools/make-blank-sheet.html")"

browser=""
for cand in \
  "${CHROME:-}" \
  "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files/Microsoft/Edge/Application/msedge.exe" \
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)"
do
  if [ -n "$cand" ] && [ -x "$cand" ]; then browser="$cand"; break; fi
done
[ -n "$browser" ] || { echo "no Chrome/Chromium/Edge found; set CHROME" >&2; exit 1; }

mkdir -p "$(dirname "$out")"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# --force-device-scale-factor=1 so the shot is in CSS pixels whatever the
# machine's own display scaling is, and --hide-scrollbars so no 15px strip of
# scrollbar is baked into the right edge of the paper.
"$browser" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --force-device-scale-factor=1 \
  --default-background-color=FFFFFFFF \
  --user-data-dir="$tmp/profile" \
  --window-size="$w,$h" \
  --screenshot="$(winpath "$tmp/shot.png")" \
  "file:///$src?bare=1&o=$orientation" >/dev/null 2>&1

[ -f "$tmp/shot.png" ] || { echo "the browser produced no screenshot" >&2; exit 1; }

# A sheet of paper is one flat colour with two short lines of grey on it, and
# Chrome's own PNG writer spends 42 kB on that. Re-deflating it without a row
# filter (the rows are identical, so filtering them only adds noise) brings it
# to 13 kB, pixel for pixel the same image — it is precached by the service
# worker, so the bytes are worth having. Skipped if ImageMagick is absent.
magick=""
for cand in magick convert "/c/Program Files/ImageMagick-7.1.1-Q16-HDRI/magick"; do
  if command -v "$cand" >/dev/null 2>&1; then magick="$cand"; break; fi
done
if [ -n "$magick" ]; then
  "$magick" "$(winpath "$tmp/shot.png")" -strip \
    -define png:compression-level=9 -define png:compression-filter=0 \
    "$(winpath "$tmp/small.png")"
  cp "$tmp/small.png" "$out"
else
  cp "$tmp/shot.png" "$out"
fi
echo "wrote $out ($(wc -c <"$out") bytes)"
