## Update

Improved speed with parallel downloads, UI redesign, and more.
Tested on Apple Silicon Mac and Windows. Intel Mac is untested — please send feedback if you run into issues!


## About

I built this for myself. I was paying for 4K Downloader, but they suddenly killed the app...

I work at sea. I need to download videos all at once for offline use.
Travel vlogs have tons of episodes, and it's hard to watch them in order.
So I made downloads sort like `260311_VideoTitle` to keep them organized.


## Download

https://github.com/sunpark20/YT-Chita/releases


## Features

- **Full Channel Download** — Download every video from a channel at once
- **Playlist Download** — A single playlist, or all playlists from a channel
- **Single Video Download** — Just paste one URL
- **Duplicate Skip** — Automatically skips already downloaded files
- **Quality Selection** — Audio only (m4a) / 360p / 720p / 1080p / Best quality
- **Shorts Filter** — Option to exclude videos under 3 minutes when analyzing a channel


## Limitations

- **Apple Silicon Mac first** — I don't have an Intel Mac or Windows machine, so testing is very difficult.
Please report issues via comments or email, and I'll fix them when I can. (The Windows version currently can't auto-update yt-dlp, so it may break often. Sorry!)
- **Critical bug** — yt-dlp auto-update doesn't work on Windows.
- **Known issues to fix** — 1. How to improve the update flow? (Internet download) 2. Subtitle toggle


## Format

- **Audio (m4a)**: Original AAC saved as-is (no conversion, plays on both iPhone and Android)
- **360p / 720p / 1080p**: H.264 preferred, falls back to other codecs
- **Best quality**: Any codec, highest resolution download (4K VP9/AV1, etc.)


## Notes

- Adding a YouTube API key reduces errors and speeds up video analysis. Recommended when downloading 100+ videos.
