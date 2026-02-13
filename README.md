# DosFsociety Discord Bot

디스코드 봇: 환영 메시지, 티켓(비공개 스레드), 인사 답장, 로그.

## 빠른 시작

```bash
cp .env.example .env   # 토큰·CLIENT_ID 등 입력
npm install
npm run build
npm start
```

자세한 설정과 Intent 활성화 방법은 **[docs/setup.md](docs/setup.md)** 를 참고하세요.

## 문서

| 문서                                 | 설명             |
| ------------------------------------ | ---------------- |
| [docs/README.md](docs/README.md)     | 문서 목차        |
| [docs/setup.md](docs/setup.md)       | 설정 및 실행     |
| [docs/features.md](docs/features.md) | 기능 개요        |
| [docs/ticket.md](docs/ticket.md)     | 티켓 상세 가이드 |
| [docs/commands.md](docs/commands.md) | 명령어 참조      |

## 기능 요약

- **환영 메시지** — 새 멤버 입장 시 설정 채널로 안내 (`/config welcome`)
- **티켓** — 비공개 스레드 기반, 패널·클레임·트랜스크립트 (`/ticket panel` 등)
- **인사 답장** — "안녕" / "굿모닝" / "잘자" 메시지에 봇이 reply로 인사
- **로그** — 입장, 메시지 삭제/수정, 역할 변경, 음성 채널 이벤트 (`/config log`)

데이터: `data/bot.db` (SQLite)
