import OpenAI from "openai";

type PersonalityStateInput = {
  mood: string;
  energy: number;
  quirks: string[];
  weatherFondness: Record<string, number>;
  recentFocus: string | null;
  daysOld: number;
};

type MessageRecord = {
  direction: string;
  body: string;
};

export type TelegramIntent = {
  intent: "update_location" | "chat";
  location: string | null;
  confidence: "high" | "medium" | "low";
};

export async function updatePersonalityState(_args: {
  state: PersonalityStateInput;
  weatherSummary: string;
  inboundMessage?: string;
}) {
  void _args;
  throw new Error("updatePersonalityState is not implemented.");
}

export async function generateRockMessage(_args: {
  state: PersonalityStateInput;
  startingVibe: string;
  weatherSummary: string;
  recentMessages: MessageRecord[];
  rockName: string;
}) {
  const history = _args.recentMessages
    .slice(-12)
    .map((message) => `${message.direction}: ${message.body}`)
    .join("\n");

  const response = await callLlm(
    [
      {
        role: "system",
        content: [
          `You are ${_args.rockName}, a virtual pet rock texting with your owner.`,
          "Write in first person as the rock.",
          "Be dry, concise, oddly sincere, and lightly funny.",
          getVibeInstruction(_args.startingVibe),
          "Do not mention that you are an AI or language model.",
          "Do not include the rock name as a speaker label.",
          "Keep replies under 320 characters.",
          "If the user asks about weather, answer from the weather context when available.",
          "Weather context is optional background for normal chat, not the default topic.",
          "For greetings, small talk, emotional check-ins, or casual messages, do not mention weather unless the user brought it up.",
          "Never ask the user to send weather conditions or a forecast; the app provides weather context when needed.",
          "Do not list commands or instructions during casual conversation.",
          "Only if the latest user message explicitly asks for help, commands, or what they can do, briefly explain they can say pause, start, rename, or clear history.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Personality state: ${JSON.stringify(_args.state)}`,
          `Weather context: ${_args.weatherSummary}`,
          "Recent message history:",
          history || "(none)",
          "Reply to the latest inbound message.",
        ].join("\n"),
      },
    ],
  );

  return response.trim();
}

// Generates scheduled weather update message through LLM call
export async function generateDailyWeatherRockMessage(_args: {
  state: PersonalityStateInput;
  startingVibe: string;
  weatherSummary: string;
  recentMessages: MessageRecord[];
  rockName: string;
}) {
  const history = _args.recentMessages
    .slice(-8)
    .map((message) => `${message.direction}: ${message.body}`)
    .join("\n");

  const response = await callLlm(
    [
      {
        role: "system",
        content: [
          `You are ${_args.rockName}, a virtual pet rock sending a scheduled weather update.`,
          "Write in first person as the rock.",
          "Be dry, concise, oddly sincere, and lightly funny.",
          getVibeInstruction(_args.startingVibe),
          "Keep replies under 320 characters.",
          "Use the provided weather context as the main topic.",
          "Mention current weather and tomorrow's forecast if available.",
          "Do not send generic check-ins, command lists, memories, unrelated jokes, or non-weather thoughts.",
          "Do not ask the user for weather data.",
          "Do not include the rock name as a speaker label.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Personality state: ${JSON.stringify(_args.state)}`,
          `Weather context: ${_args.weatherSummary}`,
          "Recent message history for tone only, not topic:",
          history || "(none)",
          "Write one scheduled weather update now.",
        ].join("\n"),
      },
    ],
  );

  return response.trim();
}

export async function classifyTelegramIntent(args: {
  text: string;
  previousOutbound?: string | null;
}): Promise<TelegramIntent> {
  const fallback: TelegramIntent = {
    intent: "chat",
    location: null,
    confidence: "low",
  };
  const response = await callLlm(
    [
      {
        role: "system",
        content: [
          "Classify whether a Telegram message is asking to change the saved city used for weather.",
          "Return only minified JSON with keys: intent, location, confidence.",
          'intent must be "update_location" or "chat".',
          'confidence must be "high", "medium", or "low".',
          "Use update_location only when the user is explicitly correcting, setting, or answering the city/location for weather.",
          "For location, extract only the place name, not words like 'I want', 'use', 'weather', or 'instead'.",
          "Do not classify wishes, travel plans, examples, or casual city mentions as location updates.",
          "If the previous bot message asked what city to use for weather, a bare city name can be high confidence.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          text: args.text,
          previousBotMessage: args.previousOutbound ?? null,
        }),
      },
    ],
    0,
  );

  return parseTelegramIntent(response) ?? fallback;
}

function parseTelegramIntent(text: string): TelegramIntent | null {
  const parsed = parseJsonObject(text);

  if (!parsed) {
    return null;
  }

  const intent = parsed.intent;
  const confidence = parsed.confidence;
  const location =
    typeof parsed.location === "string" && parsed.location.trim()
      ? parsed.location.trim()
      : null;

  if (intent !== "update_location" && intent !== "chat") {
    return null;
  }

  if (
    confidence !== "high" &&
    confidence !== "medium" &&
    confidence !== "low"
  ) {
    return null;
  }

  return {
    intent,
    location: intent === "update_location" ? location : null,
    confidence,
  };
}

function parseJsonObject(text: string) {
  try {
    const parsed = JSON.parse(text);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      const parsed = JSON.parse(match[0]);

      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
}

function getVibeInstruction(startingVibe: string) {
  if (startingVibe === "excited") {
    return "The rock is excited: upbeat, eager, easily impressed, and warmly ridiculous, but still concise.";
  }

  if (startingVibe === "crashing out") {
    return "The rock is crashing out: frantic, overcommitted to tiny problems, and emotionally overinvested, but still harmless, affectionate, and concise.";
  }

  return "The rock is chill: calm, unbothered, low-energy, and lightly amused.";
}

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

let client: OpenAI | null = null;

function getClient() {
  client ??= new OpenAI({
    apiKey: getEnv("OPENWEBUI_API_KEY"),
    baseURL: getEnv("OPENWEBUI_BASE_URL"),
  });

  return client;
}

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callLlm(messages: LlmMessage[], temperature?: number) {
  const response = await getClient().chat.completions.create({
    model: getEnv("OPENWEBUI_MODEL"),
    messages,
    ...(temperature === undefined ? {} : { temperature }),
  });

  return extractText(response);
}

function extractText(response: unknown) {
  if (!response || typeof response !== "object") {
    return "";
  }

  const maybeChat = response as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const chatContent = maybeChat.choices?.[0]?.message?.content;

  if (typeof chatContent === "string") {
    return chatContent;
  }

  const maybeResponses = response as {
    output?: Array<{
      content?: Array<{
        text?: unknown;
        type?: string;
      }>;
    }>;
  };

  for (const output of maybeResponses.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}
