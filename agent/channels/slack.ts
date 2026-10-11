import { connectSlackCredentials } from "@vercel/connect/eve";
import { slackChannel } from "eve/channels/slack";

// SLACK_CONNECTOR is provisioned by the "Deploy with Vercel" button. To set it
// up yourself, create a connector with `vercel connect create slack --triggers`
// and put its UID in SLACK_CONNECTOR (or replace the fallback below).
export default slackChannel({
  credentials: connectSlackCredentials(
    process.env.SLACK_CONNECTOR ?? "slack/my-agent",
  ),
});
/**
EVE.SLACK — Point d'entrée Slack Bolt
Auteur : Aissa Mohammedi (DGK) */
import "dotenv/config"; import { App, LogLevel } from "@slack/bolt"; import { handleMessage } from "./agent.js"; import { routeChannel } from "./channels/index.js";
const app = new App({ token: process.env.SLACK_BOT_TOKEN, signingSecret: process.env.SLACK_SIGNING_SECRET, socketMode: true, appToken: process.env.SLACK_APP_TOKEN, logLevel: LogLevel.INFO, });
// ═══════════════════════════════════════════════════════════════════ // LISTENER PRINCIPAL // ═══════════════════════════════════════════════════════════════════ app.message(async ({ message, say, client }) => { if (message.subtype === "bot_message") return; if (!("text" in message) || !message.text) return;
const text = message.text.trim(); const channel = message.channel; const user = message.user || "unknown";
console.log([MSG] user=${user} channel=${channel} text="${text}");
try { // Routing par channel const channelConfig = routeChannel(channel);
// Traitement par l'agent
const response = await handleMessage({
  text,
  user,
  channel,
  config: channelConfig,
});

await say({
  blocks: response.blocks,
  text: response.fallbackText,
});
} catch (error) { console.error("[ERROR]", error); await say("❌ Une erreur est survenue. Réessaie dans un instant."); } });
// ═══════════════════════════════════════════════════════════════════ // COMMANDE /eve // ═══════════════════════════════════════════════════════════════════ app.command("/eve", async ({ command, ack, respond }) => { await ack();
const args = command.text.trim().split(/\s+/); const subCommand = args[0] || "help";
switch (subCommand) { case "help": await respond({ blocks: [ { type: "header", text: { type: "plain_text", text: "🤖 EVE — Commandes disponibles" }, }, { type: "section", text: { type: "mrkdwn", text: "Commandes :\n" + "• /eve help — Affiche cette aide\n" + "• /eve ping — Test de connexion\n" + "• /eve weather <ville> — Météo temps réel\n" + "• /eve trip <destination> — Planifier un voyage\n" + "• /eve status — État du système", }, }, ], text: "EVE help", }); break;
case "ping":
  await respond(`🏓 Pong ! Latence : ${Date.now() - parseInt(command.trigger_id.split(".")[0])}ms`);
  break;

case "weather":
  const city = args.slice(1).join(" ") || "Montréal";
  await respond(`⏳ Récupération météo pour *${city}*...`);
  // Appel du tool weather (voir tools/get_weather.ts)
  break;

case "trip":
  const destination = args.slice(1).join(" ") || "Paris";
  await respond(`✈️ Préparation du voyage à *${destination}*...`);
  break;

case "status":
  await respond({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*État EVE*\n🟢 Agent actif\n📊 Uptime : ${Math.floor(process.uptime())}s\n💾 Mémoire : ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        },
      },
    ],
    text: "Status",
  });
  break;

default:
  await respond(`❓ Commande inconnue : \`${subCommand}\`. Tape \`/eve help\`.`);
} });
// ═══════════════════════════════════════════════════════════════════ // LANCEMENT // ═══════════════════════════════════════════════════════════════════ (async () => { try { await app.start(); console.log("⚡️ EVE.SLACK est en ligne !"); console.log(📡 Port : ${process.env.PORT || 3000}); } catch (error) { console.error("❌ Erreur de démarrage :", error); process.exit(1); } })();
