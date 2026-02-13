# 설정 및 실행

## 필요한 것

- Node.js 18+
- 봇 토큰 및 Application ID (Discord Developer Portal)
- 서버에서 **Privileged Gateway Intents** 활성화:
  - Server Members Intent
  - Message Content Intent

## 설정

1. `.env.example`을 `.env`로 복사 후 값 입력:

```env
DISCORD_TOKEN=봇_토큰
CLIENT_ID=Application_ID
TICKET_RETENTION_DAYS=30
```

2. 의존성 설치 및 빌드:

```bash
npm install
npm run build
```

3. 실행:

```bash
npm start
```

개발 시 (파일 변경 시 자동 재시작):

```bash
npm run dev
```

## 데이터 저장

- 설정 및 티켓 데이터: 프로젝트 루트의 `data/bot.db` (SQLite)
- `data/` 폴더는 최초 실행 시 자동 생성됩니다.
