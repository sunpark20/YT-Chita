# ytninza Architecture

## 전체 시스템 구조

```mermaid
graph TB
    subgraph Desktop["데스크톱 앱"]
        PW[pywebview 네이티브 윈도우]
    end

    subgraph Frontend["Frontend - Vanilla JS"]
        HTML[index.html]
        JS[app.js]
        CSS[style.css]
    end

    subgraph API["API Layer - FastAPI"]
        SERVER[server.py]
        ROUTES[routes.py]
        MODELS[models.py]
    end

    subgraph Services["Services - 비즈니스 로직"]
        YTAPI[youtube_api.py<br/>YouTube Data API v3]
        DL[downloader.py<br/>yt-dlp 래퍼]
        DEDUP[duplicate_filter.py<br/>중복 제거]
        ARCHIVE[download_archive.py<br/>다운로드 기록]
        UPDATER[updater.py<br/>yt-dlp 자동 업데이트]
    end

    subgraph Utils["Utils - 유틸리티"]
        CONFIG[config.py]
        LOGGER[logger.py]
        VALID[validators.py]
        KEYMANAGER[key_manager.py]
        CRASH[crash_reporter.py]
    end

    subgraph External["외부 의존성"]
        YTDLP[yt-dlp]
        GAPI[Google API]
        FFMPEG[FFmpeg]
    end

    subgraph Storage["파일 시스템"]
        DOWNLOADS["~/Downloads/ytninza/<br/>Channel/Playlist/"]
        ARCHIVEFILE[.download_archive]
        LOGS[로그 파일]
    end

    PW -->|"localhost:8000"| SERVER
    HTML --> JS
    JS -->|"Fetch API / SSE"| ROUTES
    SERVER --> ROUTES
    ROUTES --> MODELS
    ROUTES --> YTAPI
    ROUTES --> DL
    ROUTES --> DEDUP
    ROUTES --> ARCHIVE
    ROUTES --> UPDATER
    YTAPI --> GAPI
    DL --> YTDLP
    YTDLP --> FFMPEG
    DL --> DOWNLOADS
    ARCHIVE --> ARCHIVEFILE
    LOGGER --> LOGS
    ROUTES --> CONFIG
    ROUTES --> VALID
    YTAPI --> KEYMANAGER
    CRASH --> LOGS
```

## 사용자 요청 흐름

```mermaid
sequenceDiagram
    actor User as 사용자
    participant FE as Frontend (app.js)
    participant API as FastAPI (routes.py)
    participant YT as YouTubeAPIService
    participant DL as YTBulkDownloader
    participant DF as DuplicateFilter
    participant AR as DownloadArchive
    participant FS as 파일 시스템

    User->>FE: URL 입력 + 분석 클릭
    FE->>API: POST /api/channel/analyze

    alt API 키 있음
        API->>YT: get_channel_videos()
        YT-->>API: 영상 목록 (최대 5000개)
    else API 키 없음
        API->>DL: get_channel_videos()
        DL-->>API: 영상 목록 (yt-dlp fallback)
    end

    API->>DF: deduplicate_video_ids()
    DF-->>API: 중복 제거된 목록
    API->>DF: filter_already_downloaded()
    DF-->>API: 미다운로드 영상만
    API-->>FE: {videos, stats}
    FE-->>User: 영상 목록 표시

    User->>FE: 영상 선택 + 다운로드
    loop 선택된 각 영상
        FE->>API: POST /api/download/start
        API->>DL: download_video()
        DL->>FS: 파일 저장
        API->>AR: add_video()
        AR->>FS: .download_archive 기록
        API-->>FE: SSE 진행률 스트리밍
        FE-->>User: 실시간 진행률 표시
    end
```

## 앱 시작 흐름

```mermaid
flowchart TD
    START([main.py 실행]) --> SINGLE{중복 실행 체크}
    SINGLE -->|이미 실행 중| EXIT([종료])
    SINGLE -->|OK| ENV[환경 검증<br/>PyObjC, ffmpeg, 아키텍처]
    ENV --> UPDATE[yt-dlp 자동 업데이트]
    UPDATE --> PORT[사용 가능한 포트 탐색<br/>8000~]
    PORT --> FASTAPI[FastAPI 서버 시작<br/>백그라운드 스레드]
    FASTAPI --> WEBVIEW[pywebview 윈도우 생성]
    WEBVIEW --> LOAD["localhost:{port} 로드"]
    LOAD --> HEALTH[app.js → /api/health 확인]
    HEALTH --> READY([앱 준비 완료])
```

## 디렉토리 구조

```
ytninza/
├── src/
│   ├── main.py                  # 앱 진입점 (pywebview + FastAPI)
│   ├── api/
│   │   ├── server.py            # FastAPI 앱 설정, ASGI
│   │   ├── routes.py            # HTTP 엔드포인트 (30+개)
│   │   └── models.py            # Pydantic 요청/응답 모델
│   ├── services/
│   │   ├── downloader.py        # yt-dlp 래퍼 (YTBulkDownloader)
│   │   ├── youtube_api.py       # YouTube Data API v3 (YouTubeAPIService)
│   │   ├── duplicate_filter.py  # 중복 제거 (Set + SHA-256 + 제목 매칭)
│   │   ├── download_archive.py  # 다운로드 기록 관리
│   │   └── updater.py           # yt-dlp 자동 업데이트
│   ├── utils/
│   │   ├── config.py            # 설정, 경로, 버전
│   │   ├── logger.py            # 로깅 (파일 + 콘솔, 7일 로테이션)
│   │   ├── validators.py        # URL 검증, ID 추출
│   │   ├── key_manager.py       # API 키 관리
│   │   ├── crash_reporter.py    # 크래시 리포트
│   │   └── webview2_setup.py    # Windows WebView2 체크
│   └── frontend/
│       ├── index.html           # SPA 구조
│       ├── css/style.css        # 스타일링
│       └── js/app.js            # 프론트엔드 로직
├── resource/                    # 정적 에셋 (사운드, 이미지)
├── .github/workflows/           # GitHub Actions CI/CD
└── ytninza.spec               # PyInstaller 빌드 설정
```

## 핵심 설계 결정

| 결정 | 이유 |
|------|------|
| **Dual-Path** (YouTube API + yt-dlp fallback) | API 키 없이도 동작, 있으면 빠름 |
| **pywebview + FastAPI** | 크로스플랫폼 데스크톱 앱을 웹 기술로 구현 |
| **SSE (Server-Sent Events)** | 폴링 없이 실시간 다운로드 진행률 |
| **3단계 중복 제거** | Set(ID) → archive 파일 → 제목 매칭 |
| **yt-dlp 자동 업데이트** | YouTube 변경에 자동 대응 |
| **채널/플레이리스트/영상 폴더 구조** | 정리된 다운로드 관리 |
