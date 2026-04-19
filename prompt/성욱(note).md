# 기능 변경 노트
> 요점만 간단히적기

## 로컬 실행 방법
cd /Users/sunguk/0.code/0.suspend/YT-Chita
source venv/bin/activate
python3 src/main.py

- FastAPI 서버가 `127.0.0.1:8000`에 뜨고 pywebview 데스크톱 창이 열림
- 8000 포트 사용 중이면 8001~8009 자동 탐색
- ffmpeg 필요 (`brew install ffmpeg`)

## 프래그먼트 병렬 + 포맷 재시도 + 스킵 사유 표시 (2026-03-13)
- `concurrent_fragment_downloads: 4` → DASH 프래그먼트 4개 동시 다운로드, 속도 대폭 향상
- 앱 레벨 재시도: "format not available" 에러 시 3초 대기 후 1회 재시도 (extract_info 재호출)
- 성인제한/멤버십 영상 → 실패 대신 `스킵 · 성인제한`, `스킵 · 멤버십`으로 사유 표시
- 결과: 26개 중 실패 0 (성인제한 1개는 스킵 처리)

## retry + sleep 추가 (2026-03-13)
- **현상**: 빠니보틀 채널 14개 영상 다운로드 시 2개 간헐 실패 (`Requested format is not available`)
- **원인**: YouTube CDN이 연속 요청 시 일부 포맷을 일시적으로 안 내려줌
- **조치**: `ydl_opts_base`에 retry 3회 + sleep 1~3초 옵션 추가 (`src/services/downloader.py`)
- **결과**: 재시도로 자동 복구, 요청 간 랜덤 대기로 봇 탐지 회피
