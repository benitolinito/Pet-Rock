import { NextResponse } from "next/server";
import {
  generateDailyRockMessage,
  recordOutboundRockMessage,
} from "@/lib/rockMessaging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { getWeather } from "@/lib/weather";


// Define the structure of a daily rock
type DailyRock = {
  id: string;
  name: string;
  telegram_chat_id: string | null;
  starting_vibe: string;
  latitude: number;
  longitude: number;
  timezone: string;
  personality_state: unknown;
  last_daily_sent_on: string | null;
};

// Get the local date and hour for a given timezone
function getLocalParts(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

// Determine if a daily message should be sent for a given rock
function shouldSendToday(rock: DailyRock) {
  const { date, hour } = getLocalParts(rock.timezone);

  return {
    localDate: date,
    due:
      rock.telegram_chat_id !== null &&
      rock.last_daily_sent_on !== date &&
      hour >= 9 &&
      hour < 18,
  };
}

// Summarize the weather for a given location
function summarizeWeather(weather: Awaited<ReturnType<typeof getWeather>>) {
  const condition = weather.weather[0]?.description ?? "unknown conditions";
  const temp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);

  return `${weather.name}: ${condition}, ${temp}F, feels like ${feelsLike}F.`;
}

// Main function to handle the daily cron job
export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data: rocks, error } = await supabase
    .from("rocks")
    .select(
      "id, name, telegram_chat_id, starting_vibe, latitude, longitude, timezone, personality_state, last_daily_sent_on",
    )
    .eq("paused", false)
    .not("telegram_chat_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const rock of (rocks ?? []) as DailyRock[]) {
    const { due, localDate } = shouldSendToday(rock);

    if (!due || !rock.telegram_chat_id) {
      results.push({ id: rock.id, status: "skipped" });
      continue;
    }

    try {
      const weather = await getWeather(rock.latitude, rock.longitude);
      const message = await generateDailyRockMessage({
        supabase,
        channel: "telegram",
        rock,
        weatherSummary: summarizeWeather(weather),
      });
      const sent = await sendTelegramMessage(rock.telegram_chat_id, message);

      await recordOutboundRockMessage({
        supabase,
        rockId: rock.id,
        body: message,
        providerSid: sent?.message_id
          ? `telegram:${rock.telegram_chat_id}:${sent.message_id}`
          : null,
      });

      await supabase
        .from("rocks")
        .update({ last_daily_sent_on: localDate })
        .eq("id", rock.id);

      results.push({ id: rock.id, status: "sent" });
    } catch (error) {
      console.error("Daily cron failed for rock", rock.id, error);
      results.push({ id: rock.id, status: "failed" });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: rocks?.length ?? 0,
    results,
  });
}
