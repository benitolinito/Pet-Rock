export const siteConfig = {
  name: "Pet Rock",
  legalName: "Pet Rock",
  operatorName:
    process.env.NEXT_PUBLIC_OPERATOR_NAME ?? "Ben Lin",
  projectType:
    process.env.NEXT_PUBLIC_PROJECT_TYPE ??
    "Independent SMS application project",
  description:
    "Pet Rock is an SMS companion service that sends conversational, weather-aware text messages from your adopted rock.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pet-rock-hmdeuzk1b-ben-lins-projects.vercel.app/",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "blin97198@gmail.com",
  supportPhone:
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "603-322-8292",
  operatorLocation:
    process.env.NEXT_PUBLIC_OPERATOR_LOCATION ?? "United States",
  supportHours:
    process.env.NEXT_PUBLIC_SUPPORT_HOURS ??
    "Monday through Friday, 9:00 AM to 5:00 PM Eastern Time",
  launchDescription:
    process.env.NEXT_PUBLIC_LAUNCH_DESCRIPTION ??
    "Pet Rock is operated as a live SMS product for users who want a lightweight, playful texting companion.",
  about:
    process.env.NEXT_PUBLIC_ABOUT_TEXT ??
    "Pet Rock is an independently developed project that lets users opt in to receive playful SMS messages from a virtual pet rock.",
  supportResponseTime:
    process.env.NEXT_PUBLIC_SUPPORT_RESPONSE_TIME ??
    "Support requests are usually answered within 2 business days.",
};

export const smsConsentDisclosure =
  "By submitting this form, you agree to receive recurring conversational and service-related text messages from Pet Rock at the mobile number you provided. Message frequency varies. Message and data rates may apply. Reply STOP to cancel. Reply HELP for help. Consent is not a condition of purchase.";

export const sampleMessages = [
  "hello. i'm pebble. i will be monitoring your local weather with sincere emotional investment.",
  "today looks cloudy. i'm choosing to call it dramatic rather than gloomy.",
  "you texted your rock and your rock texted back. this feels like a stable arrangement.",
];
