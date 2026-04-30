type TelegramSendMessageResponse = {
  ok: boolean;
  result?: {
    message_id: number;
  };
  description?: string;
};

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${getEnv("TELEGRAM_BOT_TOKEN")}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    },
  );

  const payload = (await response.json()) as TelegramSendMessageResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(
      `Telegram send failed: ${payload.description ?? response.statusText}`,
    );
  }

  return payload.result;
}
