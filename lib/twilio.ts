import Twilio from "twilio";

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const client = Twilio(
  getEnv("TWILIO_ACCOUNT_SID"),
  getEnv("TWILIO_AUTH_TOKEN"),
);

export async function sendSms(to: string, body: string) {
  return client.messages.create({
    to,
    body,
    from: getEnv("TWILIO_FROM_NUMBER"),
  });
}
