import tzLookup from "tz-lookup";

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

// Fetches the weather for a given location
type WeatherResponse = {
  weather: Array<{ main: string; description: string }>;
  main: { temp: number; feels_like: number };
  name: string;
};

type ForecastResponse = {
  city: { name: string };
  list: Array<{
    dt: number;
    dt_txt: string;
    weather: Array<{ main: string; description: string }>;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
    };
    pop?: number;
  }>;
};

// Geocodes a location based on a query string
type GeocodingResponse = Array<{
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}>;

export type GeocodedLocation = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  state: string | null;
};

export type GeocodeLocationResult =
  | { status: "found"; location: GeocodedLocation }
  | { status: "ambiguous"; matches: GeocodedLocation[] }
  | { status: "not_found" };

// Maps US state abbreviations to their full names
const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

// Geocodes a location based on a query string
export async function geocodeLocation(query: string) {
  const result = await resolveLocation(query);

  return result.status === "found" ? result.location : null;
}

export async function resolveLocation(query: string): Promise<GeocodeLocationResult> {
  const usQuery = buildOpenWeatherUsQuery(query);
  const explicitQuery = Boolean(usQuery) || hasCountryQualifier(query);

  if (usQuery) {
    const [location] = await geocodeOpenWeather(usQuery, 1);

    if (location) {
      return { status: "found", location };
    }
  }

  const locations = await geocodeOpenWeather(query, 5);

  if (locations.length === 0) {
    const expandedLocations = await geocodeOpenWeather(expandUsState(query), 5);

    return expandedLocations[0]
      ? { status: "found", location: expandedLocations[0] }
      : { status: "not_found" };
  }

  const ambiguousMatches = explicitQuery
    ? []
    : getAmbiguousMatches(locations);

  if (ambiguousMatches.length > 1) {
    return { status: "ambiguous", matches: ambiguousMatches };
  }

  return { status: "found", location: locations[0] };
}

async function geocodeOpenWeather(query: string, limit: number) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    appid: getEnv("OPENWEATHER_API_KEY"),
  });

  // Fetch the geocoding data
  const response = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to geocode location.");
  }

  const data = (await response.json()) as GeocodingResponse;

  return data.map((location) => ({
    name: location.name,
    latitude: location.lat,
    longitude: location.lon,
    country: location.country,
    state: location.state ?? null,
  }));
}

function buildOpenWeatherUsQuery(query: string) {
  const match = query.trim().match(/^(.+?)[,\s]+([A-Za-z]{2})$/);

  if (!match || !US_STATE_NAMES[match[2].toUpperCase()]) {
    return null;
  }

  return `${match[1].trim()},${match[2].toUpperCase()},US`;
}

function hasCountryQualifier(query: string) {
  return /(?:,\s*[A-Za-z]{2,3}|[,\s]+(?:USA|US|United States|UK|United Kingdom|Canada|Germany|France|Italy|Spain|Mexico|Australia))$/i.test(
    query.trim(),
  );
}

function getAmbiguousMatches(locations: GeocodedLocation[]) {
  const [first] = locations;

  if (!first) {
    return [];
  }

  const sameName = locations.filter(
    (location) => location.name.toLowerCase() === first.name.toLowerCase(),
  );
  const firstHasUsAlternative =
    first.country !== "US" && sameName.some((location) => location.country === "US");
  const multipleUsStates =
    first.country === "US" &&
    new Set(
      sameName
        .filter((location) => location.country === "US")
        .map((location) => location.state),
    ).size > 1;

  return firstHasUsAlternative || multipleUsStates ? sameName : [];
}

// Expands a US state abbreviation to its full name
function expandUsState(query: string) {
  const match = query.trim().match(/^(.+?)[,\s]+([A-Za-z]{2})$/);

  if (!match) {
    return query;
  }

  const state = US_STATE_NAMES[match[2].toUpperCase()];

  if (!state) {
    return query;
  }

  return `${match[1]}, ${state}`;
}

// Fetches the weather for a given latitude and longitude
export async function getWeather(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    appid: getEnv("OPENWEATHER_API_KEY"),
    units: "imperial",
  });

  // Fetch the weather data
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather.");
  }

  return (await response.json()) as WeatherResponse;
}

export async function getForecast(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    appid: getEnv("OPENWEATHER_API_KEY"),
    units: "imperial",
  });

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch forecast.");
  }

  return (await response.json()) as ForecastResponse;
}

export function getTimezone(latitude: number, longitude: number) {
  return tzLookup(latitude, longitude);
}
