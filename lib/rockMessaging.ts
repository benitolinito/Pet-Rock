import type { SupabaseClient } from "@supabase/supabase-js";

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

  return buildRockReply({
    channel: args.channel,
    rockName: args.rock.name,
    text: args.body,
  });
}
