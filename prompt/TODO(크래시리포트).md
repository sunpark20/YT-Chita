# 크래시리포트 자동화 TODO

## 현재 완료 상태 (2026-03-16)

### MCP 서버 수정 완료
- [x] `.claude/settings.local.json`에 `mcp__gmail__get_email`, `mcp__gmail__mark_as_read` 권한 추가
- [x] MCP 서버 에러 핸들링 수정 — throw 대신 isError 응답 반환 (서버 크래시 방지)
- [x] IMAP authTimeout 3초 → 10초, connTimeout 10초 → 15초 증가
- [x] `fetchMessages` race condition 수정 — Promise.all로 비동기 파싱 완료 대기
- [x] `mark_as_read(read=false)` 버그 수정 — delFlags에 빈 문자열 대신 `\Seen` 전달

### 개별 도구 테스트 결과
- [x] `mcp__gmail__search_emails` — crashreport 3건 검색 성공
- [x] `mcp__gmail__get_email` — 이메일 본문 디코딩 정상 (quoted-printable 자동 처리)
- [x] `mcp__gmail__mark_as_read` — 읽음/읽지않음 전환 성공

### 미완료
- [ ] Claude Code 재시작 후 `/project:c-crashreport` end-to-end 실행 확인
  - MCP 서버 수정 후 현재 세션에서 재연결 불가, 재시작 필요

## 향후 자동화 계획

### Phase 1: 안정화
- [ ] `/project:c-crashreport` 명령 실행 시 에러 없이 보고서 출력 검증
- [ ] 대량 리포트(100건+) 처리 시 타임아웃 없는지 확인
- [ ] 다양한 에러 유형(RuntimeError, PermissionError, FileNotFoundError 등) 파싱 검증

### Phase 2: 자동화 확장
- [ ] 주기적 자동 실행 (cron 또는 GitHub Actions)
- [ ] 크래시 트렌드 추적 (버전별, OS별 발생 빈도)
- [ ] 신규 에러 유형 발견 시 알림

### Phase 3: 코드 연동
- [ ] 크래시 리포트에서 발견된 버그를 GitHub Issue로 자동 생성
- [ ] 크래시 빈도 기반 우선순위 자동 설정
