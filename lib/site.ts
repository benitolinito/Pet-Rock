export const siteConfig = {
  name: "Pet Rock",
  legalName: "Pet Rock",
  operatorName:
    process.env.NEXT_PUBLIC_OPERATOR_NAME ?? "Ben Lin",
  projectType:
    process.env.NEXT_PUBLIC_PROJECT_TYPE ??
    "Independent SMS application project",
  description:
    "Pet Rock is an opt-in SMS application that sends conversational and weather-aware text messages to subscribed users.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pet-rock-sigma.vercel.app/",
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
    "Pet Rock is a live public SMS application with a signup form, welcome message flow, ongoing text delivery, and standard STOP and HELP support.",
  about:
    process.env.NEXT_PUBLIC_ABOUT_TEXT ??
    "Pet Rock is an independently developed application that lets users opt in on the website to receive recurring SMS messages from a virtual pet rock experience.",
  supportResponseTime:
    process.env.NEXT_PUBLIC_SUPPORT_RESPONSE_TIME ??
    "Support requests are usually answered within 2 business days.",
};

export const smsConsentDisclosure =
  "By submitting this form, you agree to receive recurring conversational and service-related text messages from Pet Rock at the mobile number you provided. Message frequency varies. Message and data rates may apply. Reply STOP to cancel. Reply HELP for help. Consent is not a condition of purchase.";

export const sampleMessages = [
  "Welcome to Pet Rock. Your rock is active and will send periodic messages to this number.",
  "Pet Rock update: current weather conditions have been recorded for your selected location.",
  "Pet Rock reply: your message was received. Reply STOP to unsubscribe or HELP for support.",
];
