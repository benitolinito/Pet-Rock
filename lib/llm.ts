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
  weatherSummary: string;
  recentMessages: MessageRecord[];
  rockName: string;
}) {
  void _args;
  throw new Error("generateRockMessage is not implemented.");
}

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const client = new OpenAI({
  apiKey: getEnv("OPENWEBUI_API_KEY"),
  baseURL: getEnv("OPENWEBUI_BASE_URL"),
});

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callLlm(messages: LlmMessage[], temperature = 0.7) {
  const response = await client.chat.completions.create({
    model: getEnv("OPENWEBUI_MODEL"),
    messages,
    temperature,
  });

  return response.choices[0]?.message?.content ?? "";
}
