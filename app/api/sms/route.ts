import { normalizePhoneNumber } from "@/lib/phone";
import {
  handleInboundRockMessage,
  recordInboundRockMessage,
  recordOutboundRockMessage,
} from "@/lib/rockMessaging";
import { siteConfig } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function xml(message: string) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
      },
    },
  );
}

const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const fromRaw = formData.get("From");
  const bodyRaw = formData.get("Body");
  const messageSidRaw = formData.get("MessageSid");

  if (typeof fromRaw !== "string") {
    return xml(
      `Pet Rock support: ${siteConfig.supportEmail}. Reply STOP to unsubscribe.`,
    );
  }

  const from = normalizePhoneNumber(fromRaw);
  const body = typeof bodyRaw === "string" ? bodyRaw.trim() : "";
  const normalizedBody = body.toUpperCase();
  const messageSid = typeof messageSidRaw === "string" ? messageSidRaw : null;

  const supabase = createSupabaseAdminClient();
  const { data: rock } = await supabase
    .from("rocks")
    .select("id, name")
    .eq("phone_number", from)
    .single();

  if (!rock) {
    return xml(
      `Pet Rock support: ${siteConfig.supportEmail}. Reply STOP to unsubscribe.`,
    );
  }

  if (
    body &&
    (STOP_KEYWORDS.has(normalizedBody) ||
      normalizedBody === "START" ||
      normalizedBody === "UNSTOP" ||
      normalizedBody === "HELP" ||
      normalizedBody === "INFO")
  ) {
    await recordInboundRockMessage({
      supabase,
      rockId: rock.id,
      body,
      providerSid: messageSid,
    });
  }

  if (STOP_KEYWORDS.has(normalizedBody)) {
    await supabase
      .from("rocks")
      .update({ paused: true, opted_out_at: new Date().toISOString() })
      .eq("id", rock.id);

    return xml(
      "You have successfully unsubscribed from Pet Rock. Reply START to resubscribe.",
    );
  }

  if (normalizedBody === "START" || normalizedBody === "UNSTOP") {
    await supabase
      .from("rocks")
      .update({ paused: false, opted_out_at: null })
      .eq("id", rock.id);

    return xml(
      `You are subscribed again to Pet Rock messages. Reply HELP for help or STOP to opt out.`,
    );
  }

  if (normalizedBody === "HELP" || normalizedBody === "INFO") {
    return xml(
      `Pet Rock support: ${siteConfig.supportEmail}. Message frequency varies. Message and data rates may apply. Reply STOP to cancel.`,
    );
  }

  const reply = await handleInboundRockMessage({
    supabase,
    channel: "sms",
    rock,
    body,
    inboundProviderSid: messageSid,
  });

  await recordOutboundRockMessage({
    supabase,
    rockId: rock.id,
    body: reply,
    providerSid: null,
  });

  return xml(reply);
}
