export const siteConfig = {
  name: "Pet Rock",
  legalName: "Pet Rock",
  description:
    "Pet Rock is an SMS companion service that sends conversational, weather-aware text messages from your adopted rock.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://petrock.app",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@petrock.app",
  supportPhone:
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "Support available by email.",
  supportHours:
    process.env.NEXT_PUBLIC_SUPPORT_HOURS ??
    "Monday through Friday, 9:00 AM to 5:00 PM Eastern Time",
};

export const smsConsentDisclosure =
  "By submitting this form, you agree to receive recurring conversational and service-related text messages from Pet Rock at the mobile number you provided. Message frequency varies. Message and data rates may apply. Reply STOP to cancel. Reply HELP for help. Consent is not a condition of purchase.";
