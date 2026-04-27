import { NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/phone";
import { smsConsentDisclosure } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      !body.phone ||
      !body.name ||
      !body.startingVibe ||
      !body.timezone ||
      !body.consentChecked ||
      body.latitude === undefined ||
      body.longitude === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const phoneNumber = normalizePhoneNumber(body.phone);
    const consentCheckedAt = new Date().toISOString();

    const personalityState = {
      mood: "content",
      energy: 67,
      quirks: [],
      weather_fondness: {},
      recent_focus: null,
      days_old: 0,
    };

    const supabase = createSupabaseAdminClient();

    const { data: rock, error: rockError } = await supabase
      .from("rocks")
      .insert({
        phone_number: phoneNumber,
        name: body.name,
        starting_vibe: body.startingVibe,
        latitude: body.latitude,
        longitude: body.longitude,
        timezone: body.timezone,
        personality_state: personalityState,
        consent_checked_at: consentCheckedAt,
        consent_text: smsConsentDisclosure,
      })
      .select()
      .single();

    if (rockError || !rock) {
      return NextResponse.json(
        { error: rockError?.message ?? "Failed to create rock." },
        { status: 500 },
      );
    }

    const welcomeMessage = `hello. i'm ${body.name}. i will be watching the weather with quiet concern.`;
    const sms = await sendSms(phoneNumber, welcomeMessage);

    const { error: messageError } = await supabase.from("messages").insert({
      rock_id: rock.id,
      direction: "outbound",
      body: welcomeMessage,
      provider_sid: sms.sid,
    });

    if (messageError) {
      return NextResponse.json(
        { error: messageError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
