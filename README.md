# 🌤️ WEATHER EVE — Agent Slack interactif qui vit
<div align="center">

**Un agent Slack qui ne se contente pas de répondre. Il agit, réagit, anticipe, et vit.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?connect=%5B%7B%22type%22%3A%22slack%22%2C%22env%22%3A%22SLACK_CONNECTOR%22%2C%22triggers%22%3Atrue%2C%22triggerPath%22%3A%22%2Feve%2Fv1%2Fslack%22%7D%5D&demo-title=Weather%20EVE%20Interactif&project-name=weather-eve&repository-name=weather-eve&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Feve-examples%2Ftree%2Fmain%2Feve-slack-agent-template)

[![eve](https://img.shields.io/badge/eve-latest-blue)](https://eve.dev)
[![Slack](https://img.shields.io/badge/Slack-live-4A154B)](https://slack.com)
[![Realtime](https://img.shields.io/badge/realtime-WebSocket-green)](https://slack.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## 🎬 Regarde-le vivre

### 1. Tu mentionnes @weather — il RÉAGIT tout de suite

Toi : @weather quel temps à Montréal ?

**Ce qui se passe dans les 500ms :**
- ⚡ Réaction emoji ☀️ sur TON message
- 💬 Typing indicator "…" dans le channel
- 🎯 Puis le message complet

☀️ Montréal — 18°C (ressenti 17°C)
Ciel dégagé · Vent 12 km/h NE · Humidité 65%

💡 Belle journée — profites-en

╭─────────────────────────────────────────╮
│ 🔄 Actualiser 📅 7 jours 📊 Comparer │
│ ⭐ Favori ⚙️ Options 📍 Localiser │
╰─────────────────────────────────────────╯

### 2. Tu cliques sur 📅 7 jours — le message SE TRANSFORME

Pas de nouveau message. **Le même message se met à jour** avec une animation.

📅 Montréal — 7 prochains jours

🟩🟩🟨🟨🟥🟥🟩 ← température sur 7 jours

Lun 🌤️ 12° / 19° 💧 20% 💨 15 km/h
Mar ☀️ 14° / 22° 💧 5% 💨 10 km/h
Mer 🌧️ 11° / 16° 💧 80% 💨 25 km/h
Jeu ⛈️ 10° / 15° 💧 95% 💨 40 km/h ⚠️
Ven 🌧️ 11° / 17° 💧 65% 💨 20 km/h
Sam 🌤️ 13° / 20° 💧 15% 💨 12 km/h
Dim ☀️ 15° / 23° 💧 0% 💨 8 km/h

[🔄 Actualiser] [⭐ Favori] [🔔 Alertes]

### 3. Tu cliques sur 📊 Comparer — un MODAL s'ouvre

┌──────────────────────────────────────────┐
│ 📊 Comparer avec une autre ville │
├──────────────────────────────────────────┤
│ │
│ Ville à comparer │
│ [ Paris ▼ ] │
│ │
│ Unité │
│ ● Celsius ○ Fahrenheit │
│ │
│ Critères │
│ ☑ Température ☑ Vent ☑ Pluie │
│ │
│ [Annuler] [Comparer] │
└──────────────────────────────────────────┘

### 4. Tu réagis avec ⚠️ sur n'importe quel message

L'agent détecte, analyse, et **répond intelligemment** :

⚠️ Alerte détectée sur ton message

Ta réaction ⚠️ indique une préoccupation.

Que veux-tu faire ?
[🔔 Voir les alertes météo] [📞 Contacter l'équipe] [❌ Ignorer]

### 5. 7h du matin — il envoie AUTOMATIQUEMENT le rapport

🌅 Bonjour Aissa !

Météo du jour :

☀️ Montréal 18°C Ensoleillé
🌤️ Paris 22°C Nuageux
🌧️ Tokyo 16°C Pluvieux

⚡ Alerte : Orage prévu à Montréal vers 17h

💡 Conseil : Sors ce matin, il pleut à 17h

[📅 Ma semaine] [⭐ Gérer favoris] [⚙️ Paramètres]

---

## 🧬 Ce qui le rend VIVANT

| Ce que tu fais | Ce qu'il fait |
|----------------|---------------|
| Tu le mentionnes | Réaction emoji instantanée + typing indicator |
| Tu cliques un bouton | Le message **se transforme** (pas un nouveau) |
| Tu passes la souris | Menu contextuel s'affiche |
| Tu réagis à un message | Il analyse ta réaction et agit |
| Tu quittes Slack | Il continue à surveiller (cron) |
| Tu reviens 8h après | Il t'accueille avec un résumé |
| Tu lui demandes la même chose 2x | Il répond instantané (cache) |
| Tu changes de ville | Il **apprend** tes préférences |
| Tu parles une autre langue | Il détecte et adapte |
| Tu es en stress (typos, urgent) | Il priorise ta demande |

---

## 🎨 Comment ça fonctionne

### Le canal Slack interactif

```typescript
// agent/channels/slack.ts
import { slackChannel } from "eve/channels/slack";

export default slackChannel({
botName: "weather-eve",

// ─── Vivacité ───
typingIndicator: true, // "…" pendant qu'il réfléchit
autoReact: true, // réaction emoji sur tes messages
presenceAwareness: true, // sait si tu es en ligne
threads: "smart", // répond en thread si pertinent
contextWindow: "full", // garde tout le contexte

// ─── Actions en temps réel ───
interactive: true,
liveUpdates: true, // ⭐ met à jour SES propres messages
modals: true,
shortcuts: true,

// ─── Apprentissage ───
memory: {
enabled: true,
scope: "user", // apprend TES préférences
persist: "postgres", // stocke dans Postgres
},

// ─── Commandes slash ───
slashCommands: [
{ command: "/weather", description: "Météo d'une ville", usageHint: "[ville]" },
{ command: "/forecast", description: "Prévisions 7 jours", usageHint: "[ville]" },
{ command: "/compare", description: "Comparer 2 villes", usageHint: "ville1 ville2" },
{ command: "/favorites", description: "Gérer tes favoris", usageHint: "" },
{ command: "/alerts", description: "Alertes météo", usageHint: "" },
{ command: "/digest", description: "Rapport personnalisé", usageHint: "[heure]" },
],
});

Le tool qui rend les actions vivantes
// agent/tools/get_weather.ts
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
description: "Météo actuelle avec actions interactives vivantes",

inputSchema: z.object({
cityName: z.string(),
units: z.enum(["metric", "imperial"]).default("metric"),
lang: z.enum(["fr", "en"]).default("fr"),
}),

async execute({ cityName, units, lang }) {
// ... fetch météo ...

return {
// ─── Données ───
city: "Montréal",
temperature: 18,
condition: "Ciel dégagé",
icon: "☀️",
advice: "Belle journée — profites-en",

// ─── Réaction sur TON message ───
reactToSource: "☀️",

// ─── Message qui se met à jour ───
liveMessage: {
blocks: [
{
type: "header",
text: { type: "plain_text", text: "☀️ Montréal — 18°C" },
},
{
type: "context",
elements: [{ type: "mrkdwn", text: "Ressenti 17°C · Vent 12 km/h NE" }],
},
{ type: "divider" },
{
type: "actions",
elements: [
{ type: "button", text: { type: "plain_text", text: "🔄 Actualiser" }, action_id: "w_refresh", value: cityName },
{ type: "button", text: { type: "plain_text", text: "📅 7 jours" }, action_id: "w_forecast", value: cityName },
{ type: "button", text: { type: "plain_text", text: "📊 Comparer" }, action_id: "w_compare", value: cityName },
{ type: "button", text: { type: "plain_text", text: "⭐ Favori" }, action_id: "w_favorite", value: cityName },
{ type: "button", text: { type: "plain_text", text: "⚙️ Options" }, action_id: "w_options", value: cityName },
],
},
],
},

// ─── Modals disponibles ───
modals: {
compare: {
title: "📊 Comparer avec une autre ville",
fields: ["city", "units", "criteria"],
},
options: {
title: "⚙️ Options météo",
fields: ["units", "lang", "notifications", "format"],
},
},

// ─── Suggestions intelligentes ───
suggestions: [
{ text: "💡 Veux-tu les prévisions ?", action: "w_forecast" },
{ text: "📍 Ajouter à tes favoris ?", action: "w_favorite" },
],
};
},
});

Le handler d'actions en temps réel
// agent/channels/actions.ts
import { defineActionHandler } from "eve/channels/slack";

export default defineActionHandler({
// ─── Boutons ───
"w_refresh": async ({ value, respond, client }) => {
// Met à jour EN PLACE
const weather = await getWeather({ cityName: value });
await respond({
replace_original: true,
blocks: buildWeatherBlocks(weather),
});
},

"w_forecast": async ({ value, respond }) => {
// Remplace par les prévisions (même message)
const forecast = await getForecast({ cityName: value, days: 7 });
await respond({
replace_original: true,
blocks: buildForecastBlocks(forecast),
});
},

"w_compare": async ({ value, client, body, ack }) => {
// Ouvre un modal
await ack();
await client.views.open({
trigger_id: body.trigger_id,
view: {
type: "modal",
callback_id: "compare_modal",
title: { type: "plain_text", text: "📊 Comparer" },
blocks: buildCompareModal(value),
submit: { type: "plain_text", text: "Comparer" },
},
});
},

"w_favorite": async ({ value, client, user_id, respond }) => {
// Ajoute au favori (apprentissage)
await addFavorite(user_id, value);
await respond({
replace_original: false,
text: `⭐ ${value} ajoutée à tes favoris`,
});
},

"w_options": async ({ value, client, body, ack }) => {
await ack();
await client.views.open({
trigger_id: body.trigger_id,
view: buildOptionsModal(value),
});
},
});

Les réactions intelligentes
// agent/channels/reactions.ts
import { defineReactionHandler } from "eve/channels/slack";

export default defineReactionHandler({
async handle({ reaction, user, item, client }) {
const emoji = reaction;

// ─── ⚠️ = alerte ───
if (emoji === "warning") {
const alerts = await getAlerts({ city: "Montréal" });
await client.chat.postMessage({
channel: item.channel,
thread_ts: item.ts,
blocks: [
{
type: "section",
text: { type: "mrkdwn", text: "⚠️ Tu as marqué ce message. Voici les alertes :" },
},
{
type: "actions",
elements: [
{ type: "button", text: { type: "plain_text", text: "🔔 Voir alertes" }, action_id: "show_alerts" },
{ type: "button", text: { type: "plain_text", text: "🔕 Ignorer" }, action_id: "dismiss" },
],
},
],
});
}

// ─── ⭐ = favori ───
if (emoji === "star") {
await addFavoriteFromMessage(user, item);
}

// ─── ❓ = "explique-moi" ───
if (emoji === "question") {
const explanation = await explainWeatherInMessage(item);
await client.chat.postMessage({
channel: item.channel,
thread_ts: item.ts,
text: explanation,
});
}
},
});

Le cron qui envoie à 7h
// agent/schedules/daily_weather.ts
import { defineSchedule } from "eve/schedules";

export default defineSchedule({
cron: "0 7 * * *", // 7h du matin, tous les jours

async execute({ client, memory }) {
const users = await memory.getAllUsers();

for (const user of users) {
const favorites = await memory.get(user.id, "favorites") || [];
if (favorites.length === 0) continue;

const weatherPromises = favorites.map((city) => getWeather({ cityName: city }));
const weatherList = await Promise.all(weatherPromises);

// Cherche les alertes
const alerts = [];
for (const w of weatherList) {
if (w.condition.includes("Orage")) alerts.push(`⚡ Orage à ${w.city}`);
if (w.temperature > 35) alerts.push(`🔥 Canicule à ${w.city}`);
if (w.temperature < -10) alerts.push(`🥶 Froid extrême à ${w.city}`);
}

// Construit le message
const blocks = [
{ type: "header", text: { type: "plain_text", text: `🌅 Bonjour ${user.name} !` } },
{ type: "section", text: { type: "mrkdwn", text: "*Météo du jour :*\n\n" + weatherList.map(formatWeatherLine).join("\n") } },
];

if (alerts.length > 0) {
blocks.push({ type: "divider" });
blocks.push({ type: "section", text: { type: "mrkdwn", text: "*⚠️ Alertes*\n" + alerts.join("\n") } });
}

blocks.push({ type: "divider" });
blocks.push({
type: "actions",
elements: [
{ type: "button", text: { type: "plain_text", text: "📅 Ma semaine" }, action_id: "week_view" },
{ type: "button", text: { type: "plain_text", text: "⭐ Gérer favoris" }, action_id: "manage_favorites" },
{ type: "button", text: { type: "plain_text", text: "⚙️ Paramètres" }, action_id: "settings" },
],
});

await client.chat.postMessage({ channel: user.dm_channel, blocks });
}
},
});
