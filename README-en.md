## Update

Improved speed with parallel downloads, UI redesign, and more.
Tested on Apple Silicon Mac and Windows. Intel Mac is untested — please send feedback if you run into issues!


## About

I built this for myself. I was paying for 4K Downloader, but they suddenly killed the app...

I work at sea and need to download videos all at once for offline use.
Travel vlogs have tons of episodes and it's hard to watch them in order.
So downloads are saved as `260311_VideoTitle` to keep them sorted by upload date.


## Download

https://github.com/sunpark20/YT-Chita/releases

| Platform | File |
|----------|------|
| Mac (Apple Silicon) | `YB-Mac-M-Chip.dmg` |
| Mac (Intel) | `YB-Mac-Intel.dmg` |
| Windows 10/11 64bit | `YB-Windows10_11-64bit.zip` |


## Features

- **Full Channel Download** — Download every video from a channel at once
- **Playlist Download** — A single playlist, or all playlists from a channel
- **Single Video Download** — Just paste one URL
- **Duplicate Skip** — Automatically skips already downloaded files
- **Quality Selection** — Audio only (m4a) / 360p / 720p / 1080p / Best
- **Shorts Filter** — Option to exclude videos under 3 minutes


## Limitations

- **Apple Silicon Mac first** — I don't own an Intel Mac or Windows machine, so testing is difficult. Please report issues via comments or email and I'll fix them when I can.
- **Windows bug** — yt-dlp auto-update doesn't work on Windows yet. You may need to update it manually.


## Format

- **Audio (m4a)**: Original AAC saved as-is (no conversion, plays on iPhone & Android)
- **360p / 720p / 1080p**: H.264 preferred, falls back to other codecs
- **Best**: Any codec, highest resolution (4K VP9/AV1, etc.)


## Notes

- Adding a YouTube API key reduces errors and speeds up video analysis. Recommended when downloading 100+ videos.


## License

This project is released under [The Unlicense](https://unlicense.org/).

### Open Source Libraries

| Library | License |
|---------|---------|
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Unlicense |
| [FFmpeg](https://ffmpeg.org/) | LGPL-2.1 / GPL |
| [FastAPI](https://github.com/tiangolo/fastapi) | MIT |
| [pywebview](https://github.com/nicegui-kr/pywebview) | BSD-3-Clause |
| [uvicorn](https://github.com/encode/uvicorn) | BSD-3-Clause |
| [Pydantic](https://github.com/pydantic/pydantic) | MIT |
| [PyInstaller](https://github.com/pyinstaller/pyinstaller) | GPL-2.0 (build tool) |
