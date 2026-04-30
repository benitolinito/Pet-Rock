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

function getWebhookSecret() {
  const value = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!value) {
    throw new Error("Missing environment variable: TELEGRAM_WEBHOOK_SECRET");
  }

  return value;
}

function providerSid(chatId: string, messageId: number) {
  return `telegram:${chatId}:${messageId}`;
}

function getAdoptName(text: string) {
  const [, ...parts] = text.trim().split(/\s+/);
  const name = parts.join(" ").trim();

  return name || null;
}

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

function vibePrompt() {
  return "what vibe should your rock have?\nchill, dramatic, or crashing out";
}

function getRenameName(text: string) {
  return text
    .trim()
    .replace(/^\/?rename\s+/i, "")
    .replace(/^call (?:me|it|my rock)\s+/i, "")
    .trim();
}

function looksLikeRename(text: string) {
  return /^\/?rename\s+/i.test(text) || /^call (?:me|it|my rock)\s+/i.test(text);
}

function looksLikeClearHistory(text: string) {
  return (
    text === "/clear" ||
    text === "/clearhistory" ||
    /^clear (?:chat )?history$/i.test(text.trim())
  );
}

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
      .select("id, name, paused, personality_state, starting_vibe")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();


    const { data: onboardingSession } = !rock
      ? await supabase
          .from("telegram_onboarding_sessions")
          .select("rock_name")
          .eq("telegram_chat_id", chatId)
          .maybeSingle()
      : { data: null };

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
          updated_at: new Date().toISOString(),
        });

        await replyAndLog({
          chatId,
          text: "hello. i am available for adoption. what should your rock be called?",
        });
        return NextResponse.json({ ok: true });
      }

      if (onboardingSession?.rock_name) {
        const startingVibe = getStartingVibe(text);

        if (!startingVibe) {
          await replyAndLog({
            chatId,
            text: vibePrompt(),
          });
          return NextResponse.json({ ok: true });
        }

        const { data: newRock, error } = await supabase
          .from("rocks")
          .insert({
            phone_number: null,
            telegram_chat_id: chatId,
            telegram_user_id: telegramUserId,
            name: onboardingSession.rock_name,
            starting_vibe: startingVibe,
            latitude: 0,
            longitude: 0,
            timezone: "UTC",
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
            `i have been adopted with a ${startingVibe} disposition. i will observe things and report back when ready.`,
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
