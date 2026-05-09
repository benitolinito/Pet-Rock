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
