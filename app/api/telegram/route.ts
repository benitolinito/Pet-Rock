import { NextResponse } from "next/server";
import { createInitialPersonalityState } from "@/lib/personality";
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

function fallbackReply(rockName: string, text: string) {
  const normalized = text.trim().toLowerCase();

  if (normalized === "help" || normalized === "/help") {
    return `${rockName} accepts messages here. To rename it, say "call my rock NewName". Say "pause" to pause updates.`;
  }

  if (normalized === "/pause" || normalized === "pause") {
    return `${rockName} will be quiet for now. Say "start" when you want to resume.`;
  }

  return `${rockName} heard you. it is still learning how to respond, but it has stored this moment carefully.`;
}

async function replyAndLog(args: {
  chatId: string;
  rockId?: string;
  text: string;
}) {
  const sent = await sendTelegramMessage(args.chatId, args.text);

  if (!args.rockId) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("messages").insert({
    rock_id: args.rockId,
    direction: "outbound",
    body: args.text,
    provider_sid: sent?.message_id
      ? providerSid(args.chatId, sent.message_id)
      : null,
  });
}

export async function POST(request: Request) {
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
    .select("id, name, paused")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (rock) {
    await supabase.from("messages").upsert(
      {
        rock_id: rock.id,
        direction: "inbound",
        body: text,
        provider_sid: providerSid(chatId, message.message_id),
      },
      {
        onConflict: "provider_sid",
        ignoreDuplicates: true,
      },
    );
  }

  if (looksLikeRename(text)) {
    if (!rock) {
      await replyAndLog({
        chatId,
        text: "Name your rock first. Send a name like Pebble.",
      });
      return NextResponse.json({ ok: true });
    }

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
      text: `${name} has accepted the new name with geological restraint.`,
    });

    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/adopt ")) {
    if (rock) {
      await replyAndLog({
        chatId,
        rockId: rock.id,
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

    const { data: newRock, error } = await supabase
      .from("rocks")
      .insert({
        phone_number: null,
        telegram_chat_id: chatId,
        telegram_user_id: telegramUserId,
        name,
        starting_vibe: "telegram",
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

    await replyAndLog({
      chatId,
      rockId: newRock.id,
      text: `${name} has been adopted. it will observe things and report back when ready.`,
    });

    return NextResponse.json({ ok: true });
  }

  if (!rock) {
    if (text === "/start" || text.toLowerCase() === "start") {
      await replyAndLog({
        chatId,
        text: "hello. i am available for adoption. what should your rock be called?",
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

    const { data: newRock, error } = await supabase
      .from("rocks")
      .insert({
        phone_number: null,
        telegram_chat_id: chatId,
        telegram_user_id: telegramUserId,
        name,
        starting_vibe: "telegram",
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

    await replyAndLog({
      chatId,
      rockId: newRock.id,
      text: `${name} has been adopted. it will observe things and report back when ready.`,
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

  await replyAndLog({
    chatId,
    rockId: rock.id,
    text: fallbackReply(rock.name, text),
  });

  return NextResponse.json({ ok: true });
}
