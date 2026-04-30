import { NextResponse } from "next/server";
import { createInitialPersonalityState } from "@/lib/personality";
import {
  handleInboundRockMessage,
  recordInboundRockMessage,
  recordOutboundRockMessage,
  rockSays,
} from "@/lib/rockMessaging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { geocodeLocation, getTimezone } from "@/lib/weather";

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
  const normalized = text.trim().toLowerCase();

  if (normalized === "chill") {
    return "chill";
  }

  if (normalized === "dramatic") {
    return "dramatic";
  }

  if (normalized === "crashing" || normalized === "crashing out") {
    return "crashing out";
  }

  return null;
}

// Returns a prompt for the user to select a vibe
function vibePrompt() {
  return "what vibe should your rock have?\nchill, dramatic, or crashing out";
}

// Returns a prompt for the user to enter a location
function locationPrompt(rockName: string) {
  return `what city should ${rockName} watch?`;
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

// Returns the help text for the user
function helpText() {
  return [
    "Pet Rock commands:",
    "/start or start - resume updates",
    "/pause or pause - pause updates",
    "/rename Rocky or call my rock Rocky - rename your rock",
    "/vibe dramatic, change vibe to chill, or set vibe crashing out - change personality",
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
      .select("id, name, paused, personality_state, starting_vibe, latitude, longitude")
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
          "i have accepted the new name with geological restraint.",
        ),
      });

      return NextResponse.json({ ok: true });
    }

    if (looksLikeUnadopt(text)) {
      if (!rock) {
        await supabase
          .from("telegram_onboarding_sessions")
          .delete()
          .eq("telegram_chat_id", chatId);
        await replyAndLog({
          chatId,
          text: "There is no adopted rock here. Send /start to adopt one.",
        });
        return NextResponse.json({ ok: true });
      }

      await supabase
        .from("telegram_onboarding_sessions")
        .delete()
        .eq("telegram_chat_id", chatId);
      await supabase.from("rocks").delete().eq("id", rock.id);

      await replyAndLog({
        chatId,
        text: "your rock has been unadopted. send /start to adopt a new one. your visible Telegram chat is unchanged.",
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

      const location = await geocodeLocation(newLocation);

      if (!location) {
        await replyAndLog({
          chatId,
          rockId: rock.id,
          supabase,
          text: rockSays(
            rock.name,
            "i could not find that place. try a city like New York, Austin TX, or London.",
          ),
        });
        return NextResponse.json({ ok: true });
      }

      const timezone = getTimezone(location.latitude, location.longitude);

      await recordInboundRockMessage({
        supabase,
        rockId: rock.id,
        body: text,
        providerSid: providerSid(chatId, message.message_id),
      });
      await supabase
        .from("rocks")
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          timezone,
        })
        .eq("id", rock.id);
      await replyAndLog({
        chatId,
        rockId: rock.id,
        supabase,
        text: rockSays(
          rock.name,
          `i will now watch ${formatLocation(location)}. relocation accepted with minimal rolling.`,
        ),
      });

      return NextResponse.json({ ok: true });
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
          text: "hello. i am available for adoption. what should your rock be called?",
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
            text: locationPrompt(onboardingSession.rock_name),
          });
          return NextResponse.json({ ok: true });
        }

        const location = await geocodeLocation(text);

        if (!location) {
          await replyAndLog({
            chatId,
            text: "I could not find that place. Try a city like New York, Austin TX, or London.",
          });
          return NextResponse.json({ ok: true });
        }

        const timezone = getTimezone(location.latitude, location.longitude);

        const { data: newRock, error } = await supabase
          .from("rocks")
          .insert({
            phone_number: null,
            telegram_chat_id: chatId,
            telegram_user_id: telegramUserId,
            name: onboardingSession.rock_name,
            starting_vibe: onboardingSession.starting_vibe,
            latitude: location.latitude,
            longitude: location.longitude,
            timezone,
            personality_state: createInitialPersonalityState(),
            consent_checked_at: new Date().toISOString(),
            consent_text: "Telegram user started the bot and adopted a rock.",
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
            `i have been adopted with a ${onboardingSession.starting_vibe} disposition. i will watch ${formatLocation(location)} and report back when ready.`,
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
      await supabase
        .from("rocks")
        .update({ paused: false, opted_out_at: null })
        .eq("id", rock.id);
    }

    if (text === "/pause" || text.toLowerCase() === "pause") {
      await supabase
        .from("rocks")
        .update({ paused: true, opted_out_at: new Date().toISOString() })
        .eq("id", rock.id);
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
