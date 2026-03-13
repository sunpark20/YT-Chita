---
name: post-command-improve
description: "MANDATORY post-action hook: After ANY /project: command (c-github-build, c-log-debug, etc.) finishes and you report results to the user, you MUST immediately call this skill via Skill tool. Trigger signal: you just told the user a build succeeded/failed, or finished analyzing logs, or completed any /project: command task. If you see 'gh run watch' output, build success/failure message, or log analysis summary in your recent messages, STOP and call this skill NOW before doing anything else. Skipping this causes repeated mistakes because command files never get improved."
---

# 커맨드 사후 개선

`/project:` 커맨드가 완료된 뒤 실행 결과를 바탕으로 코드와 커맨드 자체를 개선한다.

## 트리거 조건 (중요)

이 스킬은 사용자가 직접 호출하는 것이 아니라, **Claude가 스스로 호출해야 한다.**

다음 조건이 모두 충족되면 즉시 `Skill tool`로 이 스킬을 호출한다:

1. 현재 대화에서 `/project:` 커맨드(예: `c-github-build`, `c-log-debug`)가 실행됨
2. 해당 커맨드의 모든 작업이 완료됨 (빌드 성공/실패 확인, 로그 분석 완료 등)
3. 사용자에게 최종 결과를 보고함

**구체적 트리거 신호:**
- `/project:c-github-build` → 빌드 성공/실패 결과를 사용자에게 보고한 직후
- `/project:c-log-debug` → 로그 분석 결과를 사용자에게 보고한 직후
- 기타 `/project:` 커맨드 → 커맨드 목적의 작업이 완료된 직후

## 수행 절차

### 1단계: 결과 분석

- 방금 실행된 커맨드의 결과(로그, 에러, 빌드 결과 등)를 정리한다
- 성공/실패 여부와 주요 발견사항을 파악한다

### 2단계: 코드 개선

- 결과에서 코드로 해결할 수 있는 **실제 문제**가 발견된 경우에만 수정한다
- 개선할 점이 없으면 억지로 만들지 말고 바로 건너뛴다. 불필요한 리팩토링, 주석 추가, 스타일 변경 등은 하지 않는다
- 수정했으면 사용자에게 간단히 보고한다

### 3단계: 커맨드 md 파일 개선

- 실행한 커맨드의 md 파일(`.claude/commands/` 내)을 읽는다
- 이번 실행 경험을 바탕으로 절차, 기준, 주의사항 등을 더 정확하게 다듬을 수 있는지 판단한다
- 실행에서 새로 알게 된 사실이 있을 때만 md 파일을 업데이트한다
  - "언제 뭘 바꿨다" 같은 변경 이력이 아니라, 절차나 기준 자체를 수정/보완하는 것
  - 예: 로그 경로가 달라졌으면 경로 수정, 새로운 에러 패턴을 발견했으면 분석 기준에 추가, 불필요한 단계가 있었으면 제거
- 이미 정확한 내용이면 건드리지 않는다

### 4단계: 요약 보고

- 수행한 개선 사항을 한두 줄로 보고한다
- 개선할 것이 없었으면 "사후 개선: 변경 없음"으로 간단히 마무리한다
