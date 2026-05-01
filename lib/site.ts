export const siteConfig = {
  name: "Pet Rock",
  legalName: "Pet Rock",
  operatorName:
    process.env.NEXT_PUBLIC_OPERATOR_NAME ?? "Ben Lin",
  projectType:
    process.env.NEXT_PUBLIC_PROJECT_TYPE ??
    "Independent Telegram bot project",
  description:
    "Pet Rock is a Telegram companion bot that sends dry, oddly sincere weather-aware messages from your adopted rock.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pet-rock-sigma.vercel.app/",
  telegramUrl:
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ?? "https://t.me/my_pet_rock_bot",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "blin97198@gmail.com",
  operatorLocation:
    process.env.NEXT_PUBLIC_OPERATOR_LOCATION ?? "United States",
  supportHours:
    process.env.NEXT_PUBLIC_SUPPORT_HOURS ??
    "Monday through Friday, 9:00 AM to 5:00 PM Eastern Time",
  launchDescription:
    process.env.NEXT_PUBLIC_LAUNCH_DESCRIPTION ??
    "Pet Rock is available through Telegram with adoption, chat, weather, settings, pause, and reset flows.",
  about:
    process.env.NEXT_PUBLIC_ABOUT_TEXT ??
    "Pet Rock is an independently developed Telegram bot that lets users adopt a virtual pet rock, ask about weather, and receive weather-aware messages.",
  supportResponseTime:
    process.env.NEXT_PUBLIC_SUPPORT_RESPONSE_TIME ??
    "Support requests are usually answered within 2 business days.",
};

export const sampleMessages = [
  "rocky: i have reviewed the clouds. they are behaving like clouds, which is suspicious but legal.",
  "rocky: tomorrow looks damp. i will remain emotionally porous.",
  "rocky: Los Angeles is sunny. i am trying not to let it change me.",
];
