Gmail에서 CrashReport 이메일을 읽고 분석 보고해줘.

사용자 추가 메시지: $ARGUMENTS

---

## 수행할 작업

### 1. 미읽은 리포트 검색

`mcp__gmail__search_emails` 도구를 호출한다:
```
subject: "crashreport"
unread: true
limit: 100
```

- `unread: true`로 이미 처리된(읽음 표시된) 리포트를 자동 스킵
- 결과가 0건이면 → "새로운 크래시 리포트가 없습니다." 출력 후 **즉시 종료**

### 2. 제목 기준 그룹핑

검색 결과의 **제목(subject)**이 동일한 메시지끼리 그룹핑한다.

예시:
```
[CrashReport] 1.2.8 - RuntimeError    → 15건
[CrashReport] 1.3.0 - PermissionError → 3건
[CrashReport] 1.2.8 - FileNotFoundError → 1건
```

> **핵심**: `get_email`은 **그룹당 대표 1건만** 호출한다. 동일 제목의 나머지 메시지는 본문을 읽지 않는다.

### 3. 대표 메시지 본문 읽기

각 그룹의 첫 번째 메시지에 대해 `mcp__gmail__get_email` 도구를 호출한다:
```
messageId: (그룹 첫 번째 메시지의 ID)
```

> MCP 서버가 `mailparser`의 `simpleParser`를 사용하여 이메일 본문을 자동 디코딩한다. quoted-printable 수동 디코딩은 불필요.

### 4. 리포트 분석

각 크래시 리포트에서 아래 정보를 추출:

| 추출 항목 | 찾는 방법 |
|-----------|-----------|
| **에러 유형** | 본문 첫 2~3줄의 Exception/Error 메시지 |
| **버전** | 이메일 제목 `[CrashReport] X.Y.Z - ErrorType` 에서 추출 |
| **사용자** | 본문의 Windows 경로 `C:\Users\{username}\...` 에서 추출 |
| **플랫폼** | 로그의 `Platform:` 라인에서 추출 |
| **OS 빌드** | 로그의 OS 버전 정보에서 추출 (예: Windows 10 22H2, Windows 11 23H2) |

### 5. 보고서 출력

한국어로 아래 형식의 요약 보고서를 출력한다:

```
## CrashReport 분석 보고서

### 기본 현황
- 총 리포트: N건 (고유 에러 N종)
- 기간: YYYY-MM-DD ~ YYYY-MM-DD
- 버전: ...
- 플랫폼: ...
- 사용자: N명

### 에러 유형별 분류
| 에러 | 건수 | 영향 버전 | 영향 사용자 |
|------|------|-----------|-------------|
| RuntimeError × 15건 | 15 | 1.2.8 | user1, user2 |
| PermissionError × 3건 | 3 | 1.3.0 | user3 |

### OS 빌드별 분류
| OS 빌드 | 건수 | 주요 에러 |
|----------|------|-----------|
| Windows 10 22H2 | 10 | RuntimeError |
| Windows 11 23H2 | 8 | PermissionError |

### 사용자별 현황
| 사용자 | 리포트 수 | 주요 에러 | 버전 |
|--------|-----------|-----------|------|
| ... | ... | ... | ... |

### 추가 발견사항
- WARNING 레벨 로그에서 발견된 부수적 문제들
- (ffmpeg 누락, mutex 충돌 등)
```

### 6. 읽음 표시

분석 완료된 **모든** 메시지(그룹 대표뿐 아니라 전체)에 읽음 표시:
`mcp__gmail__mark_as_read` 도구를 호출한다:
```
messageId: (처리된 메시지 ID)
read: true
```

> 모든 메시지를 읽음 처리해야 다음 실행 시 중복 조회되지 않는다.

## 에러 핸들링

- MCP 연결 실패 시: "Gmail MCP 서버에 연결할 수 없습니다. MCP 서버 설정을 확인해주세요." 라고 안내하고 중단

## 주의사항

- 대량 리포트는 Python 스크립트로 일괄 분석하는 것이 효율적
- 코드 수정은 하지 않는다. 분석 및 보고만 수행
