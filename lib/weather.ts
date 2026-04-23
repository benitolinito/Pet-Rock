function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

type WeatherResponse = {
  weather: Array<{ main: string; description: string }>;
  main: { temp: number; feels_like: number };
  name: string;
};

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
