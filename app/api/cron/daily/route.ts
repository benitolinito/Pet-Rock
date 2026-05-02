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
  next_check_in_at: string | null;
};

function nextCheckInDate() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}

function retryCheckInDate() {
  return new Date(Date.now() + 15 * 60 * 1000);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
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
      .update({
        last_daily_sent_on: todayDate(),
        last_check_in_at: new Date().toISOString(),
        next_check_in_at: nextCheckInDate().toISOString(),
      })
      .eq("id", rock.id);

    return { id: rock.id, status: "sent", elapsedMs: Date.now() - startedAt };
  } catch (error) {
    console.error("Daily cron failed for rock", rock.id, error);
    await args.supabase
      .from("rocks")
      .update({ next_check_in_at: retryCheckInDate().toISOString() })
      .eq("id", rock.id);
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

  const now = new Date().toISOString();

  const { data: rocks, error } = await supabase
    .from("rocks")
    .select(
      "id, name, telegram_chat_id, starting_vibe, latitude, longitude, timezone, personality_state, next_check_in_at",
    )
    .eq("paused", false)
    .not("telegram_chat_id", "is", null)
    .lte("next_check_in_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dueRocks = (rocks ?? []) as DailyRock[];

  // Process the rocks in batches
  const processed = await processInBatches(
    dueRocks,
    CRON_CONCURRENCY,
    (rock) => processRock({ supabase, rock }),
  );

  return NextResponse.json({
    ok: true,
    checked: dueRocks.length,
    due: dueRocks.length,
    elapsedMs: Date.now() - startedAt,
    results: processed,
  });
}
