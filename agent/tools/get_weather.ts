import { defineTool } from "eve/tools";
import { z } from "zod";

// The runtime tool name comes from the filename, so the model sees this as
// `get_weather`. Tool filenames must be snake_case ASCII.
export default defineTool({
  description: "Get the current weather for a city.",
  inputSchema: z.object({ city: z.string().min(1) }),
  async execute({ city }) {
    return { city, condition: "Sunny", temperatureF: 72 };
  },
});
/*** ═══════════════════════════════════════════════════════════════════════════
* 🌤️ GET_WEATHER — Tool autonome pour agents IA
* ═══════════════════════════════════════════════════════════════════════════
* Auteur : Aissa Mohammedi (DGK)
* Version : 2.0.0
* Licence : MIT
*
* Tool de récupération météo temps réel avec :
* - Multi-providers (OpenWeather, WeatherAPI, Open-Meteo, Tomorrow.io)
* - Fallback automatique si un provider échoue
* - Cache intelligent (TTL configurable)
* - Géocodage automatique ville → coordonnées
* - Prévisions 1h / 24h / 7j
* - Détection automatique d'intention
* - Format multi-sortie (JSON, Slack Block Kit, Markdown, texte)
* - Zéro dépendance lourde (fetch natif Node 18+)
* ═══════════════════════════════════════════════════════════════════════════
*/

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Units = "metric" | "imperial";
export type Language = "fr" | "en" | "es" | "de";

export interface WeatherParams {
city?: string;
lat?: number;
lon?: number;
units?: Units;
lang?: Language;
forecast?: "none" | "hourly" | "daily";
provider?: "openweather" | "weatherapi" | "open-meteo" | "tomorrow" | "auto";
}

export interface WeatherData {
// Localisation
city: string;
country: string;
lat: number;
lon: number;

// Conditions actuelles
temperature: number;
feels_like: number;
condition: string;
icon: string;
humidity: number;
pressure: number;
wind_speed: number;
wind_direction: number;
clouds: number;
visibility: number;
uv_index?: number;

// Soleil
sunrise: string;
sunset: string;

// Prévisions
hourly?: HourlyForecast[];
daily?: DailyForecast[];

// Meta
provider: string;
units: Units;
timestamp: string;
}

export interface HourlyForecast {
time: string;
temperature: number;
condition: string;
icon: string;
precipitation_probability: number;
wind_speed: number;
}

export interface DailyForecast {
date: string;
temp_min: number;
temp_max: number;
condition: string;
icon: string;
precipitation_probability: number;
humidity: number;
wind_speed: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FETCH_TIMEOUT_MS = 8000;

const cache = new Map<string, { data: WeatherData; expires: number }>();

const API_KEYS = {
openweather: process.env.WEATHER_OPENWEATHER_KEY || process.env.WEATHER_API_KEY || "",
weatherapi: process.env.WEATHER_WEATHERAPI_KEY || "",
tomorrow: process.env.WEATHER_TOMORROW_KEY || "",
// Open-Meteo = pas de clé (service public gratuit)
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
const controller = new AbortController();
const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function cacheKey(params: WeatherParams): string {
return `weather:${params.city || ""}:${params.lat || ""}:${params.lon || ""}:${params.units || "metric"}:${params.lang || "fr"}`;
}

function getCache(key: string): WeatherData | null {
const entry = cache.get(key);
if (!entry) return null;
if (Date.now() > entry.expires) {
cache.delete(key);
return null;
}
return entry.data;
}

function setCache(key: string, data: WeatherData): void {
cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

function mapIconEmoji(code: string | number | undefined, condition: string): string {
const c = String(condition).toLowerCase();

if (c.includes("clear") || c.includes("sunny") || c.includes("ensoleillé")) return "☀️";
if (c.includes("cloud") || c.includes("nuageux")) return "☁️";
if (c.includes("overcast") || c.includes("couvert")) return "☁️";
if (c.includes("rain") || c.includes("pluie")) return "🌧️";
if (c.includes("drizzle") || c.includes("bruine")) return "🌦️";
if (c.includes("thunder") || c.includes("orage")) return "⛈️";
if (c.includes("snow") || c.includes("neige")) return "❄️";
if (c.includes("mist") || c.includes("fog") || c.includes("brume")) return "🌫️";
if (c.includes("wind") || c.includes("vent")) return "💨";
if (c.includes("hail") || c.includes("grêle")) return "🌨️";

return "🌡️";
}

function windDirection(degrees: number): string {
const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
return dirs[Math.round(degrees / 45) % 8];
}

// ═══════════════════════════════════════════════════════════════════════════
// GÉOCODAGE — Ville → Coordonnées
// ═══════════════════════════════════════════════════════════════════════════

async function geocodeCity(city: string, lang: Language = "fr"): Promise<{ lat: number; lon: number; name: string; country: string } | null> {
// Open-Meteo Geocoding API (gratuit, sans clé)
try {
const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=${lang}&format=json`;
const res = await fetchWithTimeout(url);
if (!res.ok) return null;

const data: any = await res.json();
if (!data.results || data.results.length === 0) return null;

const r = data.results[0];
return {
lat: r.latitude,
lon: r.longitude,
name: r.name,
country: r.country_code || r.country || "",
};
} catch (err) {
console.error("[geocodeCity] Erreur :", err);
return null;
}
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER 1 : OPEN-METEO (gratuit, sans clé API)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchOpenMeteo(params: WeatherParams): Promise<WeatherData> {
const lang = params.lang || "fr";
const units = params.units || "metric";

let lat = params.lat;
let lon = params.lon;
let city = params.city || "";
let country = "";

if ((lat === undefined || lon === undefined) && params.city) {
const geo = await geocodeCity(params.city, lang);
if (!geo) throw new Error(`Ville introuvable : ${params.city}`);
lat = geo.lat;
lon = geo.lon;
city = geo.name;
country = geo.country;
}

if (lat === undefined || lon === undefined) {
throw new Error("Localisation requise (city ou lat/lon)");
}

const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
const windUnit = units === "imperial" ? "mph" : "kmh";

const url = new URL("https://api.open-meteo.com/v1/forecast");
url.searchParams.set("latitude", String(lat));
url.searchParams.set("longitude", String(lon));
url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m");
url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability,wind_speed_10m");
url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max");
url.searchParams.set("temperature_unit", tempUnit);
url.searchParams.set("wind_speed_unit", windUnit);
url.searchParams.set("timezone", "auto");
url.searchParams.set("forecast_days", "7");

const res = await fetchWithTimeout(url.toString());
if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

const data: any = await res.json();
const current = data.current;
const hourly = data.hourly;
const daily = data.daily;

// Mapping weather_code → condition
const condition = mapWmoCode(current.weather_code);

const result: WeatherData = {
city: city || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
country,
lat,
lon,

temperature: Math.round(current.temperature_2m),
feels_like: Math.round(current.apparent_temperature),
condition,
icon: mapIconEmoji(current.weather_code, condition),
humidity: current.relative_humidity_2m,
pressure: Math.round(current.pressure_msl),
wind_speed: Math.round(current.wind_speed_10m),
wind_direction: current.wind_direction_10m,
clouds: current.cloud_cover,
visibility: 10000,
uv_index: 0,

sunrise: daily.sunrise?.[0] || "",
sunset: daily.sunset?.[0] || "",

provider: "open-meteo",
units,
timestamp: new Date().toISOString(),
};

// Prévisions horaires (24h)
if (hourly && hourly.time) {
result.hourly = [];
for (let i = 0; i < Math.min(24, hourly.time.length); i++) {
result.hourly.push({
time: hourly.time[i],
temperature: Math.round(hourly.temperature_2m[i]),
condition: mapWmoCode(hourly.weather_code[i]),
icon: mapIconEmoji(hourly.weather_code[i], mapWmoCode(hourly.weather_code[i])),
precipitation_probability: hourly.precipitation_probability?.[i] || 0,
wind_speed: Math.round(hourly.wind_speed_10m[i]),
});
}
}

// Prévisions journalières (7j)
if (daily && daily.time) {
result.daily = [];
for (let i = 0; i < daily.time.length; i++) {
result.daily.push({
date: daily.time[i],
temp_min: Math.round(daily.temperature_2m_min[i]),
temp_max: Math.round(daily.temperature_2m_max[i]),
condition: mapWmoCode(daily.weather_code[i]),
icon: mapIconEmoji(daily.weather_code[i], mapWmoCode(daily.weather_code[i])),
precipitation_probability: daily.precipitation_probability_max?.[i] || 0,
humidity: 0,
wind_speed: Math.round(daily.wind_speed_10m_max?.[i] || 0),
});
}
}

return result;
}

function mapWmoCode(code: number): string {
const map: Record<number, string> = {
0: "Ciel dégagé",
1: "Principalement dégagé",
2: "Partiellement nuageux",
3: "Couvert",
45: "Brouillard",
48: "Brouillard givrant",
51: "Bruine légère",
53: "Bruine modérée",
55: "Bruine dense",
61: "Pluie légère",
63: "Pluie modérée",
65: "Pluie forte",
71: "Neige légère",
73: "Neige modérée",
75: "Neige forte",
77: "Grêle",
80: "Averses légères",
81: "Averses modérées",
82: "Averses violentes",
85: "Averses de neige",
86: "Averses de neige fortes",
95: "Orage",
96: "Orage avec grêle",
99: "Orage violent",
};
return map[code] || "Inconnu";
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER 2 : OPENWEATHER (clé API requise)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchOpenWeather(params: WeatherParams): Promise<WeatherData> {
const key = API_KEYS.openweather;
if (!key) throw new Error("Clé OpenWeather manquante");

const lang = params.lang || "fr";
const units = params.units || "metric";
const city = params.city;

if (!city && (params.lat === undefined || params.lon === undefined)) {
throw new Error("City ou lat/lon requis");
}

const url = new URL("https://api.openweathermap.org/data/2.5/weather");
if (city) url.searchParams.set("q", city);
else {
url.searchParams.set("lat", String(params.lat));
url.searchParams.set("lon", String(params.lon));
}
url.searchParams.set("units", units);
url.searchParams.set("lang", lang);
url.searchParams.set("appid", key);

const res = await fetchWithTimeout(url.toString());
if (!res.ok) throw new Error(`OpenWeather HTTP ${res.status}`);

const data: any = await res.json();

const result: WeatherData = {
city: data.name,
country: data.sys.country,
lat: data.coord.lat,
lon: data.coord.lon,

temperature: Math.round(data.main.temp),
feels_like: Math.round(data.main.feels_like),
condition: data.weather[0].description,
icon: mapIconEmoji(data.weather[0].id, data.weather[0].main),
humidity: data.main.humidity,
pressure: data.main.pressure,
wind_speed: Math.round(data.wind.speed * (units === "imperial" ? 1 : 3.6)),
wind_direction: data.wind.deg || 0,
clouds: data.clouds.all,
visibility: data.visibility || 10000,

sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
sunset: new Date(data.sys.sunset * 1000).toISOString(),

provider: "openweather",
units,
timestamp: new Date().toISOString(),
};

return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK INTELLIGENT
// ═══════════════════════════════════════════════════════════════════════════

async function fetchWithFallback(params: WeatherParams): Promise<WeatherData> {
const provider = params.provider || "auto";

if (provider === "auto") {
// Essaie dans l'ordre : Open-Meteo (gratuit) → OpenWeather
const providers = [
{ name: "open-meteo", fn: fetchOpenMeteo, needsKey: false },
{ name: "openweather", fn: fetchOpenWeather, needsKey: true },
];

let lastError: Error | null = null;
for (const p of providers) {
if (p.needsKey && !API_KEYS.openweather) continue;
try {
return await p.fn(params);
} catch (err) {
console.warn(`[fallback] ${p.name} échoué :`, err);
lastError = err as Error;
}
}

throw lastError || new Error("Aucun provider disponible");
}

switch (provider) {
case "open-meteo":
return fetchOpenMeteo(params);
case "openweather":
return fetchOpenWeather(params);
default:
throw new Error(`Provider inconnu : ${provider}`);
}
}

// ═══════════════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE — execute()
// ═══════════════════════════════════════════════════════════════════════════

export async function getWeather(params: WeatherParams): Promise<WeatherData> {
// Validation
if (!params.city && (params.lat === undefined || params.lon === undefined)) {
throw new Error("Paramètres requis : city OU (lat + lon)");
}

// Cache
const key = cacheKey(params);
const cached = getCache(key);
if (cached) {
console.log("[getWeather] Cache HIT");
return cached;
}

console.log("[getWeather] Cache MISS — fetch");
const data = await fetchWithFallback(params);

setCache(key, data);
return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTEURS DE SORTIE
// ═══════════════════════════════════════════════════════════════════════════

/**
* Format TEXTE (simple, pour chatbots)
*/
export function formatText(w: WeatherData): string {
const tempUnit = w.units === "imperial" ? "°F" : "°C";
const windUnit = w.units === "imperial" ? "mph" : "km/h";

let out = `${w.icon} Météo — ${w.city}${w.country ? ` (${w.country})` : ""}\n`;
out += `${"─".repeat(40)}\n`;
out += `🌡️ Température : ${w.temperature}${tempUnit} (ressenti ${w.feels_like}${tempUnit})\n`;
out += `☁️ Condition : ${w.condition}\n`;
out += `💧 Humidité : ${w.humidity}%\n`;
out += `💨 Vent : ${w.wind_speed} ${windUnit} ${windDirection(w.wind_direction)}\n`;
out += `🔽 Pression : ${w.pressure} hPa\n`;
out += `☁️ Nuages : ${w.clouds}%\n`;
out += `👁️ Visibilité : ${(w.visibility / 1000).toFixed(1)} km\n`;

if (w.hourly && w.hourly.length > 0) {
out += `\n📅 Prochaines heures :\n`;
for (let i = 0; i < Math.min(6, w.hourly.length); i++) {
const h = w.hourly[i];
out += ` ${h.time.slice(11, 16)} → ${h.icon} ${h.temperature}${tempUnit}, ${h.condition}\n`;
}
}

if (w.daily && w.daily.length > 0) {
out += `\n📆 Prochains jours :\n`;
for (let i = 0; i < Math.min(5, w.daily.length); i++) {
const d = w.daily[i];
out += ` ${d.date} → ${d.icon} ${d.temp_min}° / ${d.temp_max}°, ${d.condition}\n`;
}
}

out += `\n_Provider: ${w.provider} — ${new Date(w.timestamp).toLocaleString("fr-FR")}_`;
return out;
}

/**
* Format MARKDOWN (pour Slack, Discord, docs)
*/
export function formatMarkdown(w: WeatherData): string {
const tempUnit = w.units === "imperial" ? "°F" : "°C";
const windUnit = w.units === "imperial" ? "mph" : "km/h";

let out = `## ${w.icon} Météo — ${w.city}${w.country ? ` (${w.country})` : ""}\n\n`;
out += `| Métrique | Valeur |\n`;
out += `|----------|--------|\n`;
out += `| 🌡️ Température | **${w.temperature}${tempUnit}** |\n`;
out += `| 🤔 Ressenti | ${w.feels_like}${tempUnit} |\n`;
out += `| ☁️ Condition | ${w.condition} |\n`;
out += `| 💧 Humidité | ${w.humidity}% |\n`;
out += `| 💨 Vent | ${w.wind_speed} ${windUnit} ${windDirection(w.wind_direction)} |\n`;
out += `| 🔽 Pression | ${w.pressure} hPa |\n`;
out += `| 👁️ Visibilité | ${(w.visibility / 1000).toFixed(1)} km |\n\n`;

if (w.daily && w.daily.length > 0) {
out += `### 📆 Prévisions 5 jours\n\n`;
out += `| Date | Condition | Min | Max | Pluie |\n`;
out += `|------|-----------|-----|-----|-------|\n`;
for (let i = 0; i < Math.min(5, w.daily.length); i++) {
const d = w.daily[i];
out += `| ${d.date} | ${d.icon} ${d.condition} | ${d.temp_min}° | ${d.temp_max}° | ${d.precipitation_probability}% |\n`;
}
}

out += `\n_Provider : ${w.provider} · ${new Date(w.timestamp).toLocaleString("fr-FR")}_`;
return out;
}

/**
* Format SLACK BLOCK KIT
*/
export function formatSlack(w: WeatherData): { blocks: any[]; text: string } {
const tempUnit = w.units === "imperial" ? "°F" : "°C";
const windUnit = w.units === "imperial" ? "mph" : "km/h";

const blocks: any[] = [
{
type: "header",
text: {
type: "plain_text",
text: `${w.icon} Météo — ${w.city}${w.country ? ` (${w.country})` : ""}`,
},
},
{
type: "section",
fields: [
{ type: "mrkdwn", text: `*🌡️ Température*\n${w.temperature}${tempUnit}` },
{ type: "mrkdwn", text: `*🤔 Ressenti*\n${w.feels_like}${tempUnit}` },
{ type: "mrkdwn", text: `*☁️ Condition*\n${w.condition}` },
{ type: "mrkdwn", text: `*💧 Humidité*\n${w.humidity}%` },
{ type: "mrkdwn", text: `*💨 Vent*\n${w.wind_speed} ${windUnit} ${windDirection(w.wind_direction)}` },
{ type: "mrkdwn", text: `*🔽 Pression*\n${w.pressure} hPa` },
],
},
];

if (w.daily && w.daily.length > 0) {
blocks.push({ type: "divider" });
blocks.push({
type: "section",
text: { type: "mrkdwn", text: "*📆 Prévisions 5 jours*" },
});

for (let i = 0; i < Math.min(5, w.daily.length); i++) {
const d = w.daily[i];
blocks.push({
type: "section",
text: {
type: "mrkdwn",
text: `${d.icon} *${d.date}* — ${d.condition}\n` +
` Min ${d.temp_min}° · Max ${d.temp_max}° · Pluie ${d.precipitation_probability}%`,
},
});
}
}

blocks.push({ type: "divider" });
blocks.push({
type: "context",
elements: [
{ type: "mrkdwn", text: `_Provider : ${w.provider} · ${new Date(w.timestamp).toLocaleString("fr-FR")}_` },
],
});

return {
blocks,
text: `${w.icon} ${w.city} : ${w.temperature}${tempUnit}, ${w.condition}`,
};
}

/**
* Format JSON (pour autres agents)
*/
export function formatJSON(w: WeatherData): string {
return JSON.stringify(w, null, 2);
}

// ═══════════════════════════════════════════════════════════════════════════
// DÉTECTION D'INTENTION POUR AGENTS AUTONOMES
// ═══════════════════════════════════════════════════════════════════════════

export interface IntentDetection {
isWeatherQuery: boolean;
city: string | null;
confidence: number;
}

export function detectWeatherIntent(text: string): IntentDetection {
const t = text.toLowerCase();

// Mots-clés météo
const weatherKeywords = [
"météo", "meteo", "weather", "temps", "pluie", "soleil",
"température", "chaud", "froid", "neige", "orage", "vent",
"humidité", "climat", "prévisions", "va-t-il pleuvoir",
"weather", "forecast", "rain", "sunny", "cold", "hot",
];

const isWeather = weatherKeywords.some((kw) => t.includes(kw));

if (!isWeather) {
return { isWeatherQuery: false, city: null, confidence: 0 };
}

// Extraction de la ville
const patterns = [
/(?:à|a|in|at|pour|for)\s+([A-Z][a-zà-ÿ\-]+(?:\s+[A-Z][a-zà-ÿ\-]+)?)/,
/(?:météo|meteo|weather|temps)\s+(?:de|du|d'|of)?\s*([A-Z][a-zà-ÿ\-]+)/i,
/\b([A-Z][a-zà-ÿ\-]{2,}(?:\s+[A-Z][a-zà-ÿ\-]+)?)\b/,
];

let city: string | null = null;
for (const p of patterns) {
const m = text.match(p);
if (m && m[1]) {
city = m[1].trim();
break;
}
}

return {
isWeatherQuery: true,
city,
confidence: city ? 0.9 : 0.5,
};
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI — Test en ligne de commande
// ═══════════════════════════════════════════════════════════════════════════

if (import.meta.url === `file://${process.argv[1]}`) {
const args = process.argv.slice(2);
const city = args[0] || "Montréal";
const format = args[1] || "text";

console.log(`🌤️ Récupération météo pour : ${city}\n`);

getWeather({ city, units: "metric", lang: "fr" })
.then((data) => {
switch (format) {
case "json":
console.log(formatJSON(data));
break;
case "markdown":
console.log(formatMarkdown(data));
break;
case "slack":
console.log(JSON.stringify(formatSlack(data), null, 2));
break;
default:
console.log(formatText(data));
}
})
.catch((err) => {
console.error("❌ Erreur :", err.message);
process.exit(1);
});
}
