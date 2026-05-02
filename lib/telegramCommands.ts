import { getStartingVibe } from "@/lib/telegramOnboarding";
import { formatStoredLocation } from "@/lib/telegramLocation";

// Extracts a new rock name from rename-style commands.
export function getRenameName(text: string) {
  return text
    .trim()
    .replace(/^\/?rename\s+/i, "")
    .replace(/^call (?:me|it|my rock)\s+/i, "")
    .trim();
}

// Detects rename commands before they fall through to normal chat.
export function looksLikeRename(text: string) {
  return /^\/?rename\s+/i.test(text) || /^call (?:me|it|my rock)\s+/i.test(text);
}

// Extracts a supported vibe from vibe-change commands.
export function getChangeVibe(text: string) {
  const match = text
    .trim()
    .match(/^\/?(?:change vibe|set vibe|vibe)(?:\s+to)?\s+(.+)$/i);

  if (!match) {
    return null;
  }

  return getStartingVibe(match[1]);
}

// Extracts the requested city/location from explicit location commands.
export function getChangeLocation(text: string) {
  const match = text
    .trim()
    .match(
      /^\/?(?:change location|set location|location|watch|move to|watch weather in)(?:\s+to|\s+in)?\s+(.+)$/i,
    );

  if (!match) {
    return null;
  }

  return match[1].trim() || null;
}

// Allows bare city replies after the bot has asked for or corrected location.
export function canTreatBareTextAsLocation(previousOutboundBody?: string | null) {
  if (!previousOutboundBody) {
    return false;
  }

  return /(?:what city should i use for your weather|could not find that place|send .*weather|use .*for your weather|wrong city|wrong location|where are you|what city|multiple places with that name)/i.test(
    previousOutboundBody,
  );
}

// Filters bare text so ordinary chat is not mistaken for a city.
export function looksLikeBareLocation(text: string) {
  const trimmed = text.trim();

  return (
    /^[A-Za-z][A-Za-z\s,.'-]{1,79}$/.test(trimmed) &&
    !/^(?:yes|no|ok|okay|thanks|thank you|help|settings|status|start|pause|clear|commands)$/i.test(
      trimmed,
    ) &&
    !/^(?:what|what'?s|whats|how|when|where|why|who|can|could|should|would|is|are|do|does|did|tell|send)\b/i.test(
      trimmed,
    ) &&
    !/\bweather\b/i.test(trimmed) &&
    !/\b(?:i want|i need|please|can you|could you)\b/i.test(trimmed)
  );
}

// Decides when natural language location text is worth sending to the LLM classifier.
export function shouldClassifyLocationIntent(
  text: string,
  previousOutbound?: string | null,
) {
  const normalized = text.trim().toLowerCase();

  if (!normalized || normalized.startsWith("/")) {
    return false;
  }

  if (canTreatBareTextAsLocation(previousOutbound) && looksLikeBareLocation(text)) {
    return true;
  }

  const hasUpdateSignal =
    /\b(?:location|city|wrong|actually|instead|use|want|need|switch|move|moved|live|living|near|from|based in)\b/.test(
      normalized,
    ) || /\b(?:i'?m|i am|we'?re|we are)\s+(?:in|near|at)\b/.test(normalized);
  const hasWeatherUpdateSignal =
    /\bweather\b/.test(normalized) &&
    /\b(?:wrong|actually|instead|use|switch|change|set|for|in|near|at)\b/.test(
      normalized,
    );

  return hasUpdateSignal || hasWeatherUpdateSignal;
}

// Detects history-clearing commands and aliases.
export function looksLikeClearHistory(text: string) {
  return (
    text === "/clear" ||
    text === "/clearhistory" ||
    /^clear (?:chat )?history$/i.test(text.trim())
  );
}

// Detects reset/unadopt commands and aliases.
export function looksLikeUnadopt(text: string) {
  return (
    text === "/unadopt" ||
    text === "/reset" ||
    /^reset rock$/i.test(text.trim()) ||
    /^start over$/i.test(text.trim()) ||
    /^unadopt$/i.test(text.trim())
  );
}

// Detects help requests.
export function looksLikeHelp(text: string) {
  const normalized = text.trim().toLowerCase();

  return normalized === "/help" || normalized === "help" || normalized === "commands";
}

// Detects settings/status requests.
export function looksLikeSettings(text: string) {
  const normalized = text.trim().toLowerCase();

  return normalized === "/settings" || normalized === "settings" || normalized === "status";
}

// Formats user-visible settings for Telegram.
export function formatSettings(rock: {
  name: string;
  starting_vibe: string;
  location_name: string | null;
  location_region: string | null;
  location_country: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  paused: boolean;
  last_check_in_at: string | null;
  next_check_in_at: string | null;
}) {
  return [
    "Rock settings:",
    `name: ${rock.name}`,
    `vibe: ${rock.starting_vibe}`,
    `location: ${formatStoredLocation(rock)}`,
    `timezone: ${rock.timezone}`,
    `updates: ${rock.paused ? "paused" : "active"}`,
    `last check-in: ${rock.last_check_in_at ?? "not sent yet"}`,
    `next check-in: ${rock.next_check_in_at ?? "not scheduled"}`,
  ].join("\n");
}

// Lists the supported Telegram commands.
export function helpText() {
  return [
    "Pet Rock commands:",
    "/settings or settings - show current rock settings",
    "/start or start - resume updates",
    "/pause or pause - pause updates",
    "/rename Rocky or call my rock Rocky - rename your rock",
    "/vibe excited, change vibe to chill, or set vibe crashing out - change personality",
    "/location Boston, watch Austin TX, or change location to London - change weather location",
    "/clear, /clearhistory, or clear history - clear Pet Rock's remembered history",
    "/unadopt, /reset, reset rock, or start over - unadopt and start over",
  ].join("\n");
}
