// Extracts the rock name from /adopt Name.
export function getAdoptName(text: string) {
  const [, ...parts] = text.trim().split(/\s+/);
  const name = parts.join(" ").trim();

  return name || null;
}

// Normalizes supported vibe labels and common variants.
export function getStartingVibe(text: string) {
  const normalized = text.trim().toLowerCase().replace(/[-_]+/g, " ");

  if (normalized === "chill") {
    return "chill";
  }

  if (normalized === "excited" || normalized === "excite") {
    return "excited";
  }

  if (
    normalized === "crashing" ||
    normalized === "crashing out" ||
    normalized === "crash out" ||
    normalized === "crashout"
  ) {
    return "crashing out";
  }

  return null;
}

// Lists the available personality choices during onboarding.
export function vibePrompt() {
  return [
    "what vibe should your rock have?",
    "• chill - calm and low-energy",
    "• excited - upbeat and easily impressed",
    "• crashing out - chaotic but harmless",
  ].join("\n");
}

// Prompts for the city used by weather lookups.
export function locationPrompt() {
  return "what city should i use for your weather?";
}

// Starts the adoption flow for a new or reset user.
export function adoptionPrompt() {
  return "hello. i am available for adoption. what should your rock be called?";
}

// Schedules the next proactive check-in on the app's fixed cadence.
export function nextCheckInDate() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}
