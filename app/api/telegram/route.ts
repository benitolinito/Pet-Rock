import { NextResponse } from "next/server";
import { classifyTelegramIntent } from "@/lib/llm";
import { createInitialPersonalityState } from "@/lib/personality";
import {
  handleInboundRockMessage,
  recordInboundRockMessage,
  recordOutboundRockMessage,
  rockSays,
} from "@/lib/rockMessaging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { getTimezone, resolveLocation } from "@/lib/weather";

// Represents a Telegram update
type TelegramUpdate = {
  message?: {
    message_id: number;
    text?: string;
    chat: {
      id: number;
      type: string;
    };
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
  };
};

// Gets the Telegram webhook secret from the environment
function getWebhookSecret() {
  const value = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!value) {
    throw new Error("Missing environment variable: TELEGRAM_WEBHOOK_SECRET");
  }

  return value;
}

// Creates a unique ID for a Telegram message
function providerSid(chatId: string, messageId: number) {
  return `telegram:${chatId}:${messageId}`;
}

// Gets the name of the rock being adopted
function getAdoptName(text: string) {
  const [, ...parts] = text.trim().split(/\s+/);
  const name = parts.join(" ").trim();

  return name || null;
}

// Gets the starting vibe for the rock
function getStartingVibe(text: string) {
  const normalized = text.trim().toLowerCase().replace(/[-_]+/g, " ");

  if (normalized === "chill") {
    return "chill";
  }

  if (normalized === "excited" || normalized === "excite") {
    return "excited";
  }

  if (
    normalized === "crashing" ||
    normalized === "crashing out" ||
    normalized === "crash out" ||
    normalized === "crashout"
  ) {
    return "crashing out";
  }

  return null;
}

// Returns a prompt for the user to select a vibe
function vibePrompt() {
  return [
    "what vibe should your rock have?",
    "• chill - calm and low-energy",
    "• excited - upbeat and easily impressed",
    "• crashing out - chaotic but harmless",
  ].join("\n");
}

// Returns a prompt for the user to enter a location
function locationPrompt() {
  return "what city should i use for your weather?";
}

function adoptionPrompt() {
  return "hello. i am available for adoption. what should your rock be called?";
}

function nextCheckInDate() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}

// Formats a location for display
function formatLocation(location: {
  name: string;
  state: string | null;
  country: string;
}) {
  return [location.name, location.state, location.country]
    .filter(Boolean)
    .join(", ");
}

function ambiguousLocationPrompt(matches: Array<{
  name: string;
  state: string | null;
  country: string;
}>) {
  const options = matches.slice(0, 4).map(formatLocation).join("; ");

  return `i found multiple places with that name: ${options}. send the city with state or country, like Hanover NH or Hanover Germany.`;
}

function formatStoredLocation(rock: {
  location_name: string | null;
  location_region: string | null;
  location_country: string | null;
  latitude: number;
  longitude: number;
}) {
  const location = [
    rock.location_name,
    rock.location_region,
    rock.location_country,
  ]
    .filter(Boolean)
    .join(", ");

  return location || `${rock.latitude.toFixed(4)}, ${rock.longitude.toFixed(4)}`;
}


// Gets the name to use for renaming a rock
function getRenameName(text: string) {
  return text
    .trim()
    .replace(/^\/?rename\s+/i, "")
    .replace(/^call (?:me|it|my rock)\s+/i, "")
    .trim();
}

// Checks if the text looks like a request to rename a rock
function looksLikeRename(text: string) {
  return /^\/?rename\s+/i.test(text) || /^call (?:me|it|my rock)\s+/i.test(text);
}

//changes pet rock's vibe/personality
function getChangeVibe(text: string) {
  const match = text
    .trim()
    .match(/^\/?(?:change vibe|set vibe|vibe)(?:\s+to)?\s+(.+)$/i);

  if (!match) {
    return null;
  }

  return getStartingVibe(match[1]);
}

//changes location that pet rock watches over
function getChangeLocation(text: string) {
  const match = text
    .trim()
    .match(
      /^\/?(?:change location|set location|location|watch|move to|watch weather in)(?:\s+to|\s+in)?\s+(.+)$/i,
    );

  if (!match) {
    return null;
  }

  return match[1].trim() || null;
}

function canTreatBareTextAsLocation(previousOutboundBody?: string | null) {
  if (!previousOutboundBody) {
    return false;
  }

  return /(?:what city should i use for your weather|could not find that place|send .*weather|use .*for your weather|wrong city|wrong location|where are you|what city)/i.test(
    previousOutboundBody,
  );
}

function looksLikeBareLocation(text: string) {
  const trimmed = text.trim();

  return (
    /^[A-Za-z][A-Za-z\s,.'-]{1,79}$/.test(trimmed) &&
    !/^(?:yes|no|ok|okay|thanks|thank you|help|settings|status|start|pause|clear|commands)$/i.test(
      trimmed,
    ) &&
    !/^(?:what|what'?s|whats|how|when|where|why|who|can|could|should|would|is|are|do|does|did|tell|send)\b/i.test(
      trimmed,
    ) &&
    !/\bweather\b/i.test(trimmed) &&
    !/\b(?:i want|i need|please|can you|could you)\b/i.test(
      trimmed,
    )
  );
}

function shouldClassifyLocationIntent(text: string, previousOutbound?: string | null) {
  const normalized = text.trim().toLowerCase();

  if (!normalized || normalized.startsWith("/")) {
    return false;
  }

  if (canTreatBareTextAsLocation(previousOutbound) && looksLikeBareLocation(text)) {
    return true;
  }

  const hasUpdateSignal = /\b(?:location|city|wrong|actually|instead|use|want|need|switch|move|moved|live|living|near|from|based in)\b/.test(
    normalized,
  ) || /\b(?:i'?m|i am|we'?re|we are)\s+(?:in|near|at)\b/.test(normalized);
  const hasWeatherUpdateSignal =
    /\bweather\b/.test(normalized) &&
    /\b(?:wrong|actually|instead|use|switch|change|set|for|in|near|at)\b/.test(
      normalized,
    );

  return hasUpdateSignal || hasWeatherUpdateSignal;
}

//checks if the user wants to clear the chat history
function looksLikeClearHistory(text: string) {
  return (
    text === "/clear" ||
    text === "/clearhistory" ||
    /^clear (?:chat )?history$/i.test(text.trim())
  );
}

//checks if the user wants to unadopt their pet rock
function looksLikeUnadopt(text: string) {
  return (
    text === "/unadopt" ||
    text === "/reset" ||
    /^reset rock$/i.test(text.trim()) ||
    /^start over$/i.test(text.trim()) ||
    /^unadopt$/i.test(text.trim())
  );
}

// Checks if the user wants help
function looksLikeHelp(text: string) {
  const normalized = text.trim().toLowerCase();

  return normalized === "/help" || normalized === "help" || normalized === "commands";
}

function looksLikeSettings(text: string) {
  const normalized = text.trim().toLowerCase();

  return normalized === "/settings" || normalized === "settings" || normalized === "status";
}

function formatSettings(rock: {
  name: string;
  starting_vibe: string;
  location_name: string | null;
  location_region: string | null;
  location_country: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  paused: boolean;
  last_check_in_at: string | null;
  next_check_in_at: string | null;
}) {
  return [
    "Rock settings:",
    `name: ${rock.name}`,
    `vibe: ${rock.starting_vibe}`,
    `location: ${formatStoredLocation(rock)}`,
    `timezone: ${rock.timezone}`,
    `updates: ${rock.paused ? "paused" : "active"}`,
    `last check-in: ${rock.last_check_in_at ?? "not sent yet"}`,
    `next check-in: ${rock.next_check_in_at ?? "not scheduled"}`,
  ].join("\n");
}

// Returns the help text for the user
function helpText() {
  return [
    "Pet Rock commands:",
    "/settings or settings - show current rock settings",
    "/start or start - resume updates",
    "/pause or pause - pause updates",
    "/rename Rocky or call my rock Rocky - rename your rock",
    "/vibe excited, change vibe to chill, or set vibe crashing out - change personality",
    "/location Boston, watch Austin TX, or change location to London - change weather location",
    "/clear, /clearhistory, or clear history - clear Pet Rock's remembered history",
    "/unadopt, /reset, reset rock, or start over - unadopt and start over",
  ].join("\n");
}

//sends a reply and logs it
async function replyAndLog(args: {
  chatId: string;
  rockId?: string;
  supabase?: ReturnType<typeof createSupabaseAdminClient>;
  text: string;
}) {
  const sent = await sendTelegramMessage(args.chatId, args.text);

  if (!args.rockId) {
    return;
  }

  await recordOutboundRockMessage({
    supabase: args.supabase ?? createSupabaseAdminClient(),
    rockId: args.rockId,
    body: args.text,
    providerSid: sent?.message_id
      ? providerSid(args.chatId, sent.message_id)
    : null,
  });
}

async function updateLocationAndReply(args: {
  chatId: string;
  messageId: number;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  rock: { id: string; name: string };
  body: string;
  locationQuery: string;
  confirmation: (locationLabel: string) => string;
}) {
  const locationResult = await resolveLocation(cleanLocationQuery(args.locationQuery));

  if (locationResult.status === "not_found") {
    await replyAndLog({
      chatId: args.chatId,
      rockId: args.rock.id,
      supabase: args.supabase,
      text: rockSays(
        args.rock.name,
        "i could not find that place. try a city like New York, Austin TX, or London.",
      ),
    });
    return true;
  }

  if (locationResult.status === "ambiguous") {
    await replyAndLog({
      chatId: args.chatId,
      rockId: args.rock.id,
      supabase: args.supabase,
      text: rockSays(args.rock.name, ambiguousLocationPrompt(locationResult.matches)),
    });
    return true;
  }

  const location = locationResult.location;
  const timezone = getTimezone(location.latitude, location.longitude);

  await recordInboundRockMessage({
    supabase: args.supabase,
    rockId: args.rock.id,
    body: args.body,
    providerSid: providerSid(args.chatId, args.messageId),
  });
  const { error: updateError } = await args.supabase
    .from("rocks")
    .update({
      location_name: location.name,
      location_region: location.state,
      location_country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone,
    })
    .eq("id", args.rock.id);

  if (updateError) {
    throw updateError;
  }

  await replyAndLog({
    chatId: args.chatId,
    rockId: args.rock.id,
    supabase: args.supabase,
    text: rockSays(args.rock.name, args.confirmation(formatLocation(location))),
  });

  return true;
}

function cleanLocationQuery(query: string) {
  return query
    .trim()
    .replace(/[.!?]+$/g, "")
    .replace(/^(?:i want|i need|please use|please set|use|set|switch to|change to)\s+/i, "")
    .trim();
}

// Main function to handle incoming Telegram messages
export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-telegram-bot-api-secret-token");

    if (secret !== getWebhookSecret()) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;
    const text = message?.text?.trim();

    if (!message || !text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const telegramUserId = message.from ? String(message.from.id) : null;
    const supabase = createSupabaseAdminClient();

    const { data: rock } = await supabase
      .from("rocks")
      .select("id, name, paused, personality_state, starting_vibe, location_name, location_region, location_country, latitude, longitude, timezone, last_check_in_at, next_check_in_at")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();


    const { data: onboardingSession } = !rock
      ? await supabase
          .from("telegram_onboarding_sessions")
          .select("rock_name, starting_vibe")
          .eq("telegram_chat_id", chatId)
          .maybeSingle()
      : { data: null };

    if (looksLikeHelp(text)) {
      if (!rock) {
        await replyAndLog({
          chatId,
          text: `${helpText()}\n\nSend /start to adopt a rock.`,
        });
        return NextResponse.json({ ok: true });
      }

      await recordInboundRockMessage({
        supabase,
        rockId: rock.id,
        body: text,
        providerSid: providerSid(chatId, message.message_id),
      });
      await replyAndLog({
        chatId,
        rockId: rock.id,
        supabase,
        text: helpText(),
      });
      return NextResponse.json({ ok: true });
    }

    if (looksLikeSettings(text)) {
      if (!rock) {
        await replyAndLog({
          chatId,
          text: "No rock is adopted here yet. Send /start to adopt one.",
        });
        return NextResponse.json({ ok: true });
      }

      await recordInboundRockMessage({
        supabase,
        rockId: rock.id,
        body: text,
        providerSid: providerSid(chatId, message.message_id),
      });
      await replyAndLog({
        chatId,
        rockId: rock.id,
        supabase,
        text: formatSettings(rock),
      });
      return NextResponse.json({ ok: true });
    }

    if (looksLikeRename(text)) {
      if (!rock) {
        await replyAndLog({
          chatId,
          text: "Name your rock first. Send a name like Pebble.",
        });
        return NextResponse.json({ ok: true });
      }

      await recordInboundRockMessage({
        supabase,
        rockId: rock.id,
        body: text,
        providerSid: providerSid(chatId, message.message_id),
      });

      const name = getRenameName(text);

      if (!name) {
        await replyAndLog({
          chatId,
          rockId: rock.id,
          text: "Tell me the new name, like: call my rock Pebble.",
        });
        return NextResponse.json({ ok: true });
      }

      await supabase.from("rocks").update({ name }).eq("id", rock.id);
      await replyAndLog({
        chatId,
        rockId: rock.id,
        supabase,
        text: rockSays(
          name,
          "i have accepted the new name with rocky restraint.",
        ),
      });

      return NextResponse.json({ ok: true });
    }

    if (looksLikeUnadopt(text)) {
      if (!rock) {
        await supabase.from("telegram_onboarding_sessions").upsert({
          telegram_chat_id: chatId,
          telegram_user_id: telegramUserId,
          rock_name: null,
          starting_vibe: null,
          updated_at: new Date().toISOString(),
        });
        await replyAndLog({
          chatId,
          text: adoptionPrompt(),
        });
        return NextResponse.json({ ok: true });
      }

      await supabase
        .from("telegram_onboarding_sessions")
        .delete()
        .eq("telegram_chat_id", chatId);
      await supabase.from("rocks").delete().eq("id", rock.id);
      await supabase.from("telegram_onboarding_sessions").upsert({
        telegram_chat_id: chatId,
        telegram_user_id: telegramUserId,
        rock_name: null,
        starting_vibe: null,
        updated_at: new Date().toISOString(),
      });

      await replyAndLog({
        chatId,
        text: "your rock has been unadopted. what should your new rock be called?",
      });

      return NextResponse.json({ ok: true });
    }

    if (looksLikeClearHistory(text)) {
      if (!rock) {
        await replyAndLog({
          chatId,
          text: "There is no rock history here yet.",
        });
        return NextResponse.json({ ok: true });
      }

      await supabase.from("messages").delete().eq("rock_id", rock.id);
      await recordInboundRockMessage({
        supabase,
        rockId: rock.id,
        body: text,
        providerSid: providerSid(chatId, message.message_id),
      });
      await replyAndLog({
        chatId,
        rockId: rock.id,
        supabase,
        text: rockSays(
          rock.name,
          "i have cleared Pet Rock's remembered history. your visible Telegram chat is unchanged.",
        ),
      });

      return NextResponse.json({ ok: true });
    }

    const newVibe = getChangeVibe(text);

    if (newVibe) {
      if (!rock) {
        await replyAndLog({
          chatId,
          text: "Adopt a rock first, then I can change its vibe.",
        });
        return NextResponse.json({ ok: true });
      }

      await recordInboundRockMessage({
        supabase,
        rockId: rock.id,
        body: text,
        providerSid: providerSid(chatId, message.message_id),
      });
      await supabase
        .from("rocks")
        .update({ starting_vibe: newVibe })
        .eq("id", rock.id);
      await replyAndLog({
        chatId,
        rockId: rock.id,
        supabase,
        text: rockSays(
          rock.name,
          `i am now ${newVibe}. this is a controlled personality event.`,
        ),
      });

      return NextResponse.json({ ok: true });
    }

    const newLocation = getChangeLocation(text);

    if (newLocation) {
      if (!rock) {
        await replyAndLog({
          chatId,
          text: "Adopt a rock first, then I can change its location.",
        });
        return NextResponse.json({ ok: true });
      }

      await updateLocationAndReply({
        chatId,
        messageId: message.message_id,
        supabase,
        rock,
        body: text,
        locationQuery: newLocation,
        confirmation: (locationLabel) =>
          `i will use ${locationLabel} for your weather now. relocation accepted with minimal rolling.`,
      });

      return NextResponse.json({ ok: true });
    }

    const { data: previousOutbound } = rock
      ? await supabase
          .from("messages")
          .select("body")
          .eq("rock_id", rock.id)
          .eq("direction", "outbound")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    const barePromptLocation =
      rock &&
      canTreatBareTextAsLocation(previousOutbound?.body) &&
      looksLikeBareLocation(text)
        ? text
        : null;
    if (rock && barePromptLocation) {
      await updateLocationAndReply({
        chatId,
        messageId: message.message_id,
        supabase,
        rock,
        body: text,
        locationQuery: barePromptLocation,
        confirmation: (locationLabel) =>
          `understood. i will use ${locationLabel} for your weather now. my sense of place has been revised.`,
      });

      return NextResponse.json({ ok: true });
    }

    if (rock && shouldClassifyLocationIntent(text, previousOutbound?.body)) {
      const classified = await classifyTelegramIntent({
        text,
        previousOutbound: previousOutbound?.body ?? null,
      });

      if (
        classified.intent === "update_location" &&
        classified.confidence === "high" &&
        classified.location
      ) {
        await updateLocationAndReply({
          chatId,
          messageId: message.message_id,
          supabase,
          rock,
          body: text,
          locationQuery: classified.location,
          confirmation: (locationLabel) =>
            `understood. i will use ${locationLabel} for your weather now. my sense of place has been revised.`,
        });

        return NextResponse.json({ ok: true });
      }
    }

    if (text.startsWith("/adopt ")) {
      if (rock) {
        await replyAndLog({
          chatId,
          rockId: rock.id,
          supabase,
          text: `You already adopted ${rock.name}. To rename it, say "call my rock NewName".`,
        });
        return NextResponse.json({ ok: true });
      }

      const name = getAdoptName(text);

      if (!name) {
        await replyAndLog({
          chatId,
          text: "Send /adopt followed by a rock name, like /adopt Pebble.",
        });
        return NextResponse.json({ ok: true });
      }

      await supabase.from("telegram_onboarding_sessions").upsert({
        telegram_chat_id: chatId,
        telegram_user_id: telegramUserId,
        rock_name: name,
        starting_vibe: null,
        updated_at: new Date().toISOString(),
      });

      await replyAndLog({
        chatId,
        text: vibePrompt(),
      });

      return NextResponse.json({ ok: true });
    }

    if (!rock) {
      if (text === "/start" || text.toLowerCase() === "start") {
        await supabase.from("telegram_onboarding_sessions").upsert({
          telegram_chat_id: chatId,
          telegram_user_id: telegramUserId,
          rock_name: null,
          starting_vibe: null,
          updated_at: new Date().toISOString(),
        });

        await replyAndLog({
          chatId,
          text: adoptionPrompt(),
        });
        return NextResponse.json({ ok: true });
      }

      if (onboardingSession?.rock_name) {
        if (!onboardingSession.starting_vibe) {
          const startingVibe = getStartingVibe(text);

          if (!startingVibe) {
            await replyAndLog({
              chatId,
              text: vibePrompt(),
            });
            return NextResponse.json({ ok: true });
          }

          await supabase.from("telegram_onboarding_sessions").upsert({
            telegram_chat_id: chatId,
            telegram_user_id: telegramUserId,
            rock_name: onboardingSession.rock_name,
            starting_vibe: startingVibe,
            updated_at: new Date().toISOString(),
          });

          await replyAndLog({
            chatId,
            text: locationPrompt(),
          });
          return NextResponse.json({ ok: true });
        }

        const locationResult = await resolveLocation(text);

        if (locationResult.status === "not_found") {
          await replyAndLog({
            chatId,
            text: "I could not find that place. Try a city like New York, Austin TX, or London.",
          });
          return NextResponse.json({ ok: true });
        }

        if (locationResult.status === "ambiguous") {
          await replyAndLog({
            chatId,
            text: ambiguousLocationPrompt(locationResult.matches),
          });
          return NextResponse.json({ ok: true });
        }

        const location = locationResult.location;
        const timezone = getTimezone(location.latitude, location.longitude);

        const { data: newRock, error } = await supabase
          .from("rocks")
          .insert({
            telegram_chat_id: chatId,
            telegram_user_id: telegramUserId,
            name: onboardingSession.rock_name,
            starting_vibe: onboardingSession.starting_vibe,
            location_name: location.name,
            location_region: location.state,
            location_country: location.country,
            latitude: location.latitude,
            longitude: location.longitude,
            timezone,
            personality_state: createInitialPersonalityState(),
            next_check_in_at: nextCheckInDate().toISOString(),
          })
          .select("id")
          .single();

        if (error || !newRock) {
          throw new Error(error?.message ?? "Failed to create Telegram rock.");
        }

        await supabase
          .from("telegram_onboarding_sessions")
          .delete()
          .eq("telegram_chat_id", chatId);

        await replyAndLog({
          chatId,
          rockId: newRock.id,
          supabase,
          text: rockSays(
            onboardingSession.rock_name,
            `i have been adopted with a ${onboardingSession.starting_vibe} personality. ${formatLocation(location)} is now my weather-watching spot. Ask me what's the weather like!`,
          ),
        });
        return NextResponse.json({ ok: true });
      }

      const name = text.replace(/^my rock is named\s+/i, "").trim();

      if (!name || name.startsWith("/")) {
        await replyAndLog({
          chatId,
          text: "Tell me what your rock should be called. For example: Pebble.",
        });
        return NextResponse.json({ ok: true });
      }

      await supabase.from("telegram_onboarding_sessions").upsert({
        telegram_chat_id: chatId,
        telegram_user_id: telegramUserId,
        rock_name: name,
        starting_vibe: null,
        updated_at: new Date().toISOString(),
      });

      await replyAndLog({
        chatId,
        text: vibePrompt(),
      });
      return NextResponse.json({ ok: true });
    }

    if (text === "/start" || text.toLowerCase() === "start") {
      const nextCheckIn = nextCheckInDate();

      await recordInboundRockMessage({
        supabase,
        rockId: rock.id,
        body: text,
        providerSid: providerSid(chatId, message.message_id),
      });
      await supabase
        .from("rocks")
        .update({
          paused: false,
          next_check_in_at: nextCheckIn.toISOString(),
        })
        .eq("id", rock.id);
      await replyAndLog({
        chatId,
        rockId: rock.id,
        supabase,
        text: rockSays(
          rock.name,
          "i am observing again. next check-in is scheduled.",
        ),
      });
      return NextResponse.json({ ok: true });
    }

    if (text === "/pause" || text.toLowerCase() === "pause") {
      await recordInboundRockMessage({
        supabase,
        rockId: rock.id,
        body: text,
        providerSid: providerSid(chatId, message.message_id),
      });
      await supabase
        .from("rocks")
        .update({ paused: true })
        .eq("id", rock.id);
      await replyAndLog({
        chatId,
        rockId: rock.id,
        supabase,
        text: rockSays(rock.name, "i will be quiet for now."),
      });
      return NextResponse.json({ ok: true });
    }

    const reply = await handleInboundRockMessage({
      supabase,
      channel: "telegram",
      rock,
      body: text,
      inboundProviderSid: providerSid(chatId, message.message_id),
    });

    await replyAndLog({
      chatId,
      rockId: rock.id,
      supabase,
      text: reply,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook failed", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
