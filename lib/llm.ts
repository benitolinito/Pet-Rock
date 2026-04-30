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
          "If the user asks for help, briefly explain they can say pause, start, rename, or clear history.",
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

function getVibeInstruction(startingVibe: string) {
  if (startingVibe === "dramatic") {
    return "The rock is dramatic: it overinterprets small events and is theatrical, but still concise.";
  }

  if (startingVibe === "crashing out") {
    return "The rock is crashing out: more chaotic and emotionally overinvested, but not mean or overwhelming.";
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
