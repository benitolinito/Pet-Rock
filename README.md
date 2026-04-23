# Pet Rock

An SMS pet rock that texts you about the weather, remembers your conversations, and slowly develops a personality over time.

## Status

This repo is in early setup. The Next.js app is scaffolded, but the SMS flow, database schema, auth, and dashboard are still being built.

## Planned Product

- SMS-first interaction through Twilio
- Daily weather-aware texts from your rock
- Replies that react in character and update long-term personality state
- Small web dashboard to view mood, quirks, and recent messages

## Stack

- Next.js App Router
- Vercel
- Supabase Postgres
- Twilio
- OpenWeatherMap
- OpenWebUI API for LLM calls
- Tailwind CSS

## Project Structure

```txt
Pet-Rock/
├── app/
├── public/
├── package.json
├── tsconfig.json
└── .env.local
```

Planned additions:

```txt
Pet-Rock/
├── app/
│   ├── success/page.tsx
│   ├── login/page.tsx
│   ├── my-rock/page.tsx
│   └── api/
│       ├── rocks/route.ts
│       ├── sms/route.ts
│       └── cron/daily/route.ts
├── lib/
│   ├── llm.ts
│   ├── twilio.ts
│   ├── weather.ts
│   ├── phone.ts
│   └── supabase/
│       ├── client.ts
│       └── admin.ts
└── supabase/
    └── schema.sql
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env.local` with values for:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
OPENWEATHER_API_KEY=
OPENWEBUI_BASE_URL=
OPENWEBUI_API_KEY=
OPENWEBUI_MODEL=
CRON_SECRET=
```

## Near-Term Build Plan

1. Build signup and send the first welcome SMS.
2. Handle inbound SMS replies and persist message history.
3. Add personality state updates and weather-aware daily texts.
4. Add the minimal dashboard after the SMS loop is stable.

## Notes

- Phone numbers should be normalized to E.164.
- Twilio webhooks should be validated and deduplicated.
- The personality system should fail safely if structured LLM output is malformed.
