# Agent Guide

이 문서는 `CLAUDE.md`가 참조하는 `docs/architecture.md`를 바탕으로 정리한 에이전트 작업 가이드입니다.
코드를 수정하기 전에 전체 구조와 데이터 흐름을 먼저 확인하세요.

## 프로젝트 개요

YT-Chita는 YouTube 채널, 재생목록, 개별 영상을 내려받는 크로스플랫폼 데스크톱 앱입니다.

- 데스크톱 셸: `pywebview`
- 백엔드 API: `FastAPI`
- 프론트엔드: Vanilla JS, HTML, CSS
- 다운로드 엔진: `yt-dlp`
- 선택적 빠른 분석 경로: YouTube Data API v3
- 실시간 진행률: SSE(Server-Sent Events)

다운로드 파일은 사용자가 정렬해서 보기 쉽도록 업로드 날짜 기반 이름을 사용하며, 중복 다운로드 방지를 중요하게 다룹니다.

## 핵심 구조

```text
src/
├── main.py                  # 앱 진입점, pywebview + FastAPI 서버 시작
├── api/
│   ├── server.py            # FastAPI 앱 설정
│   ├── routes.py            # HTTP 엔드포인트
│   └── models.py            # Pydantic 요청/응답 모델
├── services/
│   ├── downloader.py        # yt-dlp 래퍼
│   ├── youtube_api.py       # YouTube Data API v3 연동
│   ├── duplicate_filter.py  # 중복 제거
│   ├── download_archive.py  # 다운로드 기록 관리
│   └── updater.py           # yt-dlp 자동 업데이트
├── utils/
│   ├── config.py            # 설정, 경로, 버전
│   ├── logger.py            # 로깅
│   ├── validators.py        # URL 검증, ID 추출
│   ├── key_manager.py       # API 키 관리
│   ├── crash_reporter.py    # 크래시 리포트
│   └── webview2_setup.py    # Windows WebView2 확인
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## 요청 흐름

1. 사용자가 프론트엔드에서 URL을 입력하고 분석을 요청합니다.
2. `src/frontend/js/app.js`가 API로 분석 요청을 보냅니다.
3. API 키가 있으면 `YouTubeAPIService`가 YouTube Data API로 영상 목록을 가져옵니다.
4. API 키가 없거나 fallback이 필요하면 `YTBulkDownloader`가 `yt-dlp`로 목록을 가져옵니다.
5. `duplicate_filter.py`와 `download_archive.py`가 이미 받은 영상을 제외합니다.
6. 사용자가 선택한 영상은 `download_video()` 경로로 다운로드됩니다.
7. 진행률은 SSE로 프론트엔드에 전달됩니다.

## 앱 시작 흐름

1. `src/main.py` 실행
2. 중복 실행 체크
3. 환경 검증: PyObjC, ffmpeg, 플랫폼 아키텍처
4. `yt-dlp` 자동 업데이트
5. 사용 가능한 포트 탐색
6. FastAPI 서버를 백그라운드 스레드에서 시작
7. pywebview 윈도우 생성
8. 프론트엔드가 `/api/health`로 준비 상태 확인

## 설계 원칙

- YouTube API 경로와 `yt-dlp` fallback 경로를 함께 유지합니다.
- 다운로드, 중복 제거, API 라우팅, 프론트엔드 상태 관리를 한 파일에 섞지 않습니다.
- 진행률이 필요한 동작은 기존 SSE 흐름과 호환되게 구현합니다.
- 중복 제거는 영상 ID, archive 파일, 제목 매칭 흐름을 깨지 않도록 수정합니다.
- YouTube 사이트 변경에 대응해야 하므로 `yt-dlp` 업데이트 흐름을 고려합니다.
- 사용자가 API 키 없이도 기본 기능을 사용할 수 있어야 합니다.

## 실행과 빌드

개발 실행:

```bash
./run_app.sh
```

직접 실행이 필요하면 가상환경을 활성화한 뒤 진입점을 실행합니다.

```bash
source venv/bin/activate
python3 src/main.py
```

macOS 빌드와 서명:

```bash
./build.sh
```

빌드 스크립트는 `build/`, `dist/`를 정리하고 PyInstaller, codesign, DMG 생성을 수행합니다.
수정 작업 중에는 사용자가 요청하지 않는 한 빌드 산출물이나 서명 설정을 임의로 바꾸지 마세요.

## 변경 시 주의사항

- API 모델 변경 시 `src/api/models.py`, `src/api/routes.py`, `src/frontend/js/app.js`의 계약을 함께 확인합니다.
- 다운로드 로직 변경 시 `download_archive.py`와 `duplicate_filter.py`의 부작용을 확인합니다.
- 프론트엔드 UI 변경 시 `index.html`, `style.css`, `app.js` 사이의 상태 이름과 DOM id를 맞춥니다.
- 플랫폼별 동작은 macOS Apple Silicon, Intel Mac, Windows 10/11 64bit 차이를 고려합니다.
- 외부 네트워크, YouTube API, `yt-dlp`, ffmpeg에 의존하는 기능은 실패 경로와 사용자 메시지를 확인합니다.
- README는 사용자용 문서이므로 내부 구현 설명을 과하게 노출하지 않습니다.

## 참고 문서

- `CLAUDE.md`: `docs/architecture.md` 참조
- `docs/architecture.md`: 시스템 구조, 요청 흐름, 앱 시작 흐름
- `README.md`: 한국어 사용자 문서
- `README-en.md`: 영어 사용자 문서
