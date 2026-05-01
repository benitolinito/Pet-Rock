export const siteConfig = {
  name: "Pet Rock",
  description:
    "Pet Rock is a Telegram companion bot that sends dry, oddly sincere weather-aware messages from your adopted rock.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pet-rock-sigma.vercel.app/",
  telegramUrl:
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ?? "https://t.me/my_pet_rock_bot",
};
