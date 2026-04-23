import OpenAI from "openai";

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
