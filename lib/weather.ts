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

type GeocodingResponse = Array<{
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}>;

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
  return (
    (await geocodeOpenWeather(query)) ??
    (await geocodeOpenWeather(expandUsState(query)))
  );
}

async function geocodeOpenWeather(query: string) {
  const params = new URLSearchParams({
    q: query,
    limit: "1",
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
  const location = data[0];

  if (!location) {
    return null;
  }

  return {
    name: location.name,
    latitude: location.lat,
    longitude: location.lon,
    country: location.country,
    state: location.state ?? null,
  };
}

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

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather.");
  }

  return (await response.json()) as WeatherResponse;
}
