import { NextResponse } from "next/server";
import {
  generateDailyRockMessage,
  recordOutboundRockMessage,
  summarizeTomorrowForecast,
} from "@/lib/rockMessaging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { getForecast, getWeather } from "@/lib/weather";

const CRON_CONCURRENCY = 3;

// Check if the request is an authorized cron request
function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    throw new Error("Missing environment variable: CRON_SECRET");
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

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

// Get the local date for a given timezone
function getLocalParts(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
  };
}

// Determine if a daily message should be sent for a given rock
function shouldSendToday(rock: DailyRock) {
  const { date } = getLocalParts(rock.timezone);

  return {
    localDate: date,
    due:
      rock.telegram_chat_id !== null &&
      rock.last_daily_sent_on !== date,
  };
}

// Summarize the weather for a given location
function summarizeWeather(args: {
  weather: Awaited<ReturnType<typeof getWeather>>;
  forecast: Awaited<ReturnType<typeof getForecast>>;
  timezone: string;
}) {
  const weather = args.weather;
  const condition = weather.weather[0]?.description ?? "unknown conditions";
  const temp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);

  return [
    `Current in ${weather.name}: ${condition}, ${temp}F, feels like ${feelsLike}F.`,
    summarizeTomorrowForecast(args.forecast, args.timezone),
  ]
    .filter(Boolean)
    .join(" ");
}

// Process a single rock
async function processRock(args: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  rock: DailyRock;
  localDate: string;
}) {
  const startedAt = Date.now();
  const rock = args.rock;

  if (!rock.telegram_chat_id) {
    return { id: rock.id, status: "skipped", elapsedMs: 0 };
  }

  try {
    const [weather, forecast] = await Promise.all([
      getWeather(rock.latitude, rock.longitude),
      getForecast(rock.latitude, rock.longitude),
    ]);
    const message = await generateDailyRockMessage({
      supabase: args.supabase,
      channel: "telegram",
      rock,
      weatherSummary: summarizeWeather({
        weather,
        forecast,
        timezone: rock.timezone,
      }),
    });
    const sent = await sendTelegramMessage(rock.telegram_chat_id, message);

    await recordOutboundRockMessage({
      supabase: args.supabase,
      rockId: rock.id,
      body: message,
      providerSid: sent?.message_id
        ? `telegram:${rock.telegram_chat_id}:${sent.message_id}`
        : null,
    });

    await args.supabase
      .from("rocks")
      .update({ last_daily_sent_on: args.localDate })
      .eq("id", rock.id);

    return { id: rock.id, status: "sent", elapsedMs: Date.now() - startedAt };
  } catch (error) {
    console.error("Daily cron failed for rock", rock.id, error);
    return { id: rock.id, status: "failed", elapsedMs: Date.now() - startedAt };
  }
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    results.push(
      ...(await Promise.all(items.slice(index, index + batchSize).map(fn))),
    );
  }

  return results;
}

// Main function to handle the daily cron job
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
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

  const skipped = [];
  const dueRocks = [];

  // Filter the rocks to only include those that are due for a daily message
  for (const rock of (rocks ?? []) as DailyRock[]) {
    const { due, localDate } = shouldSendToday(rock);

    if (!due || !rock.telegram_chat_id) {
      skipped.push({ id: rock.id, status: "skipped" });
      continue;
    }

    dueRocks.push({ rock, localDate });
  }

  // Process the rocks in batches
  const processed = await processInBatches(
    dueRocks,
    CRON_CONCURRENCY,
    (item) => processRock({ supabase, ...item }),
  );
  
  return NextResponse.json({
    ok: true,
    checked: rocks?.length ?? 0,
    due: dueRocks.length,
    elapsedMs: Date.now() - startedAt,
    results: [...skipped, ...processed],
  });
}
