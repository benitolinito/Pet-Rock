import type { SupabaseClient } from "@supabase/supabase-js";
import { generateRockMessage } from "@/lib/llm";
import { createInitialPersonalityState } from "@/lib/personality";
import { getForecast, getWeather } from "@/lib/weather";

export type MessageChannel = "sms" | "telegram";

export function rockSays(rockName: string, message: string) {
  return `${rockName}:\n${message}`;
}

export function buildRockReply(args: {
  channel: MessageChannel;
  rockName: string;
  text: string;
}) {
  const normalized = args.text.trim().toLowerCase();

  if (args.channel === "sms") {
    return `${args.rockName} heard you. Two-way chat is still limited right now. Reply HELP for help or STOP to cancel.`;
  }

  if (normalized === "help" || normalized === "/help") {
    return rockSays(
      args.rockName,
      'i accept messages here. to rename me, say "call my rock NewName". say "pause" if you require silence.',
    );
  }

  if (normalized === "/pause" || normalized === "pause") {
    return rockSays(
      args.rockName,
      'i will be quiet for now. say "start" when you want me to resume observing.',
    );
  }

  return rockSays(
    args.rockName,
    "i heard you. i am still learning how to respond, but i have stored this moment carefully.",
  );
}

export async function recordInboundRockMessage(args: {
  supabase: SupabaseClient;
  rockId: string;
  body: string;
  providerSid: string | null;
}) {
  if (!args.body) {
    return;
  }

  await args.supabase.from("messages").upsert(
    {
      rock_id: args.rockId,
      direction: "inbound",
      body: args.body,
      provider_sid: args.providerSid,
    },
    {
      onConflict: "provider_sid",
      ignoreDuplicates: true,
    },
  );
}

export async function recordOutboundRockMessage(args: {
  supabase: SupabaseClient;
  rockId: string;
  body: string;
  providerSid: string | null;
}) {
  await args.supabase.from("messages").insert({
    rock_id: args.rockId,
    direction: "outbound",
    body: args.body,
    provider_sid: args.providerSid,
  });
}


export async function handleInboundRockMessage(args: {
  supabase: SupabaseClient;
  channel: MessageChannel;
  rock: {
    id: string;
    name: string;
    personality_state?: unknown;
    starting_vibe?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string | null;
  };
  body: string;
  inboundProviderSid: string | null;
}) {
  await recordInboundRockMessage({
    supabase: args.supabase,
    rockId: args.rock.id,
    body: args.body,
    providerSid: args.inboundProviderSid,
  });

  const fallbackReply = buildRockReply({
    channel: args.channel,
    rockName: args.rock.name,
    text: args.body,
  });

  try {
    const { data: recentMessages, error } = await args.supabase
      .from("messages")
      .select("direction, body")
      .eq("rock_id", args.rock.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      throw error;
    }

    const generated = await generateRockMessage({
      state: normalizePersonalityState(args.rock.personality_state),
      startingVibe: args.rock.starting_vibe ?? "chill",
      weatherSummary: await getWeatherSummary(args.rock),
      recentMessages: (recentMessages ?? []).reverse(),
      rockName: args.rock.name,
    });

    if (!generated) {
      return fallbackReply;
    }

    if (args.channel === "telegram") {
      return rockSays(args.rock.name, generated);
    }

    return generated;
  } catch (error) {
    console.error("Rock reply generation failed", error);
    return fallbackReply;
  }
}


async function getWeatherSummary(rock: {
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
}) {
  if (typeof rock.latitude !== "number" || typeof rock.longitude !== "number") {
    return "No current weather context is available yet.";
  }

  const [weather, forecast] = await Promise.all([
    getWeather(rock.latitude, rock.longitude),
    getForecast(rock.latitude, rock.longitude),
  ]);
  const condition = weather.weather[0]?.description ?? "unknown conditions";
  const temp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);

  return [
    `Current in ${weather.name}: ${condition}, ${temp}F, feels like ${feelsLike}F.`,
    summarizeForecastDays(forecast, rock.timezone ?? "UTC"),
  ]
    .filter(Boolean)
    .join(" ");
}

export function summarizeForecastDays(
  forecast: Awaited<ReturnType<typeof getForecast>>,
  timezone: string,
) {
  const today = getLocalDate(Math.floor(Date.now() / 1000), timezone);
  const entriesByDate = new Map<
    string,
    Awaited<ReturnType<typeof getForecast>>["list"]
  >();

  for (const entry of forecast.list) {
    const date = getLocalDate(entry.dt, timezone);

    if (date <= today) {
      continue;
    }

    entriesByDate.set(date, [...(entriesByDate.get(date) ?? []), entry]);
  }

  const summaries = [...entriesByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 5)
    .map(([date, entries], index) =>
      summarizeForecastEntries({
        cityName: forecast.city.name,
        label: index === 0 ? "tomorrow" : formatForecastDate(date, timezone),
        entries,
      }),
    );

  if (summaries.length === 0) {
    return "";
  }

  return `Forecast: ${summaries.join(" ")}`;
}

export function summarizeTomorrowForecast(
  forecast: Awaited<ReturnType<typeof getForecast>>,
  timezone: string,
) {
  const tomorrow = getLocalDateOffset(timezone, 1);
  const entries = forecast.list.filter(
    (entry) => getLocalDate(entry.dt, timezone) === tomorrow,
  );

  if (entries.length === 0) {
    return "";
  }

  return summarizeForecastEntries({
    cityName: forecast.city.name,
    label: "tomorrow",
    entries,
  });
}

function summarizeForecastEntries(args: {
  cityName: string;
  label: string;
  entries: Awaited<ReturnType<typeof getForecast>>["list"];
}) {
  const temps = args.entries.flatMap((entry) => [
    entry.main.temp_min,
    entry.main.temp_max,
  ]);
  const low = Math.round(Math.min(...temps));
  const high = Math.round(Math.max(...temps));
  const peakPop = Math.round(
    Math.max(...args.entries.map((entry) => entry.pop ?? 0)) * 100,
  );
  const conditionCounts = new Map<string, number>();

  for (const entry of args.entries) {
    const condition = entry.weather[0]?.description ?? "unknown conditions";
    conditionCounts.set(condition, (conditionCounts.get(condition) ?? 0) + 1);
  }

  const likelyCondition =
    [...conditionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "unknown conditions";

  return `${args.label} in ${args.cityName}: mostly ${likelyCondition}, ${low}-${high}F, ${peakPop}% peak precipitation chance.`;
}

function formatForecastDate(date: string, timezone: string) {
  const noonUtc = new Date(`${date}T12:00:00Z`);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(noonUtc);
}

function getLocalDateOffset(timezone: string, dayOffset: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);

  return getLocalDate(Math.floor(date.getTime() / 1000), timezone);
}

function getLocalDate(unixSeconds: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(unixSeconds * 1000));

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export async function generateDailyRockMessage(args: {
  supabase: SupabaseClient;
  channel: MessageChannel;
  rock: {
    id: string;
    name: string;
    personality_state?: unknown;
    starting_vibe?: string | null;
  };
  weatherSummary: string;
}) {
  const fallback = args.channel === "telegram"
    ? rockSays(
        args.rock.name,
        "i have observed the weather. this is my work and my burden.",
      )
    : `${args.rock.name} observed the weather. This is its work and its burden.`;

  try {
    const { data: recentMessages, error } = await args.supabase
      .from("messages")
      .select("direction, body")
      .eq("rock_id", args.rock.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      throw error;
    }

    const generated = await generateRockMessage({
      state: normalizePersonalityState(args.rock.personality_state),
      startingVibe: args.rock.starting_vibe ?? "chill",
      weatherSummary: args.weatherSummary,
      recentMessages: [
        ...(recentMessages ?? []).reverse(),
        {
          direction: "system",
          body: "Send a proactive daily weather-aware update. The user did not message first.",
        },
      ],
      rockName: args.rock.name,
    });

    if (!generated) {
      return fallback;
    }

    if (args.channel === "telegram") {
      return rockSays(args.rock.name, generated);
    }

    return generated;
  } catch (error) {
    console.error("Daily rock message generation failed", error);
    return fallback;
  }
}

function normalizePersonalityState(state: unknown) {
  const fallback = createInitialPersonalityState();

  if (!state || typeof state !== "object") {
    return fallback;
  }

  const candidate = state as Partial<typeof fallback>;

  return {
    mood: typeof candidate.mood === "string" ? candidate.mood : fallback.mood,
    energy:
      typeof candidate.energy === "number" ? candidate.energy : fallback.energy,
    quirks: Array.isArray(candidate.quirks)
      ? candidate.quirks.filter((quirk): quirk is string => typeof quirk === "string")
      : fallback.quirks,
    weatherFondness:
      candidate.weatherFondness &&
      typeof candidate.weatherFondness === "object" &&
      !Array.isArray(candidate.weatherFondness)
        ? (candidate.weatherFondness as Record<string, number>)
        : fallback.weatherFondness,
    recentFocus:
      typeof candidate.recentFocus === "string"
        ? candidate.recentFocus
        : fallback.recentFocus,
    daysOld:
      typeof candidate.daysOld === "number" ? candidate.daysOld : fallback.daysOld,
  };
}
