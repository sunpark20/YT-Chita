# YouTube BULK DOWNLOADER

YouTube 채널, 재생목록, 개별 동영상, Shorts를 한번에 다운로드하는 macOS 데스크톱 앱.

## 주요 기능

- **채널 전체 다운로드** — 채널의 모든 영상을 한번에
- **재생목록 다운로드** — 단일 재생목록 또는 채널의 모든 재생목록
- **개별 동영상 / Shorts** — 단일 URL 입력으로 바로 다운로드
- **중복 스킵** — 이미 받은 파일 자동 건너뛰기
- **화질 선택** — 360p / 720p / 1080p / 음원만(MP3)
- **Shorts 필터** — 채널 분석 시 3분 미만 영상 제외 옵션

## 다운로드

[Releases](../../releases)에서 `YouTubeDownloader.app` 다운로드 (Apple Silicon 전용)

## 사용법

1. 앱 실행
2. YouTube URL 입력 (`@채널명`, 채널 URL, 재생목록 URL, 동영상 URL, Shorts URL)
3. 화질 선택 → 분석 → 전체 다운로드

저장 경로: `~/Downloads/YouTubeDownloader/채널명/`

## 직접 빌드

```bash
# 의존성 설치
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 실행 (개발 모드)
python src/main.py

# 빌드 + 코드 서명
bash build.sh
```

## 기술 스택

- **Frontend**: HTML/CSS/JavaScript
- **Backend**: Python + FastAPI
- **Desktop**: pywebview
- **다운로드**: yt-dlp
- **빌드**: PyInstaller

## 설정 (선택)

앱 내 설정에서 YouTube Data API v3 키를 등록하면 채널 분석이 더 빠릅니다.
없어도 yt-dlp 폴백으로 정상 동작합니다.

## License

MIT
