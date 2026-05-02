type LocationLabel = {
  name: string;
  state: string | null;
  country: string;
};

// Builds the display label used in confirmations and ambiguity prompts.
export function formatLocation(location: LocationLabel) {
  return [location.name, location.state, location.country]
    .filter(Boolean)
    .join(", ");
}

// Asks the user to disambiguate when OpenWeather returns multiple plausible places.
export function ambiguousLocationPrompt(matches: LocationLabel[]) {
  const options = matches.slice(0, 4).map(formatLocation).join("; ");

  return `i found multiple places with that name: ${options}. send the city with state or country, like Hanover NH or Paris France.`;
}

// Shows a saved location, falling back to coordinates for older/incomplete rows.
export function formatStoredLocation(rock: {
  location_name: string | null;
  location_region: string | null;
  location_country: string | null;
  latitude: number;
  longitude: number;
}) {
  const location = [
    rock.location_name,
    rock.location_region,
    rock.location_country,
  ]
    .filter(Boolean)
    .join(", ");

  return location || `${rock.latitude.toFixed(4)}, ${rock.longitude.toFixed(4)}`;
}

// Strips command-like filler before sending location text to geocoding.
export function cleanLocationQuery(query: string) {
  return query
    .trim()
    .replace(/[.!?]+$/g, "")
    .replace(/^(?:i want|i need|please use|please set|use|set|switch to|change to)\s+/i, "")
    .trim();
}
