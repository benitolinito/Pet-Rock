# Pet Rock

A Telegram pet rock that chats about the weather, remembers conversations, and
slowly develops a personality over time.

## Status

The app currently focuses on Telegram bot adoption, weather-aware chat, daily
cron messages, and Supabase-backed message history.

## Product

- Telegram-first interaction
- Weather-aware replies using OpenWeather
- Forecast-aware answers for tomorrow and upcoming weather
- Daily proactive Telegram updates
- Saved rock settings, location, vibe, and message history

## Stack

- Next.js App Router
- Vercel
- Supabase Postgres
- Telegram Bot API
- OpenWeatherMap
- OpenWebUI API for LLM calls
- Tailwind CSS

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
OPENWEATHER_API_KEY=
OPENWEBUI_BASE_URL=
OPENWEBUI_API_KEY=
OPENWEBUI_MODEL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_TELEGRAM_BOT_URL=
```

## Notes

- Telegram webhook requests are authenticated with
  `TELEGRAM_WEBHOOK_SECRET`.
- Weather location is stored per rock as a city/geocoded coordinate pair.
- Daily cron uses current weather plus tomorrow forecast.
- Inbound chat fetches forecast only when the user asks about future weather.
