export type PersonalityState = {
  mood: string;
  energy: number;
  quirks: string[];
  weatherFondness: Record<string, number>;
  recentFocus: string | null;
  daysOld: number;
};

// Rock's attributes
export function createInitialPersonalityState(): PersonalityState {
  return {
    mood: "content",
    energy: 50,
    quirks: [],
    weatherFondness: {},
    recentFocus: null,
    daysOld: 0,
  };
}

// Function to build prompts for the LLM based on the rock's personality state and other context
export function buildStateUpdatePrompt(args: {
  state: PersonalityState;
  weatherSummary: string;
  inboundMessage?: string;
}) {
  // return system + user prompt strings
}

// Function to build prompts for the LLM to generate outgoing messages based on the rock's personality state and other context
export function buildMessagePrompt(args: {
  state: PersonalityState;
  weatherSummary: string;
  recentMessages: { direction: string; body: string }[];
  rockName: string;
}) {
  // return system + user prompt strings
}
