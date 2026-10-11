import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-sonnet-5",
});
/**
EVE Agent — Logique principale
Aissa Mohammedi (DGK) */
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ═══════════════════════════════════════════════════════════════════ // TYPES // ═══════════════════════════════════════════════════════════════════ export interface MessageContext { text: string; user: string; channel: string; config?: any; }
export interface AgentResponse { blocks: any[]; fallbackText: string; }
// ═══════════════════════════════════════════════════════════════════ // CHARGEMENT DES INSTRUCTIONS // ═══════════════════════════════════════════════════════════════════ function loadInstructions(): string { const p = path.join(__dirname, "instructions.md"); try { return fs.readFileSync(p, "utf-8"); } catch { return "Tu es EVE, un agent Slack autonome."; } }
// ═══════════════════════════════════════════════════════════════════ // DÉTECTION D'INTENTION // ═══════════════════════════════════════════════════════════════════ type Intent = "trip" | "weather" | "help" | "general";
function detectIntent(text: string): Intent { const t = text.toLowerCase(); if (/\b(voyage|trip|itinéraire|itineraire|planifie|destination)\b/.test(t)) return "trip"; if (/\b(météo|meteo|weather|temps|pluie|soleil|température)\b/.test(t)) return "weather"; if (/\b(help|aide|commandes?)\b/.test(t)) return "help"; return "general"; }
// ═══════════════════════════════════════════════════════════════════ // HANDLER PRINCIPAL // ═══════════════════════════════════════════════════════════════════ export async function handleMessage(ctx: MessageContext): Promise<AgentResponse> { const instructions = loadInstructions(); const intent = detectIntent(ctx.text);
console.log([AGENT] intent=${intent} user=${ctx.user});
switch (intent) { case "trip": return handleTrip(ctx); case "weather": return handleWeather(ctx); case "help": return handleHelp(); default: return handleGeneral(ctx); } }
// ═══════════════════════════════════════════════════════════════════ // HANDLERS PAR INTENTION // ═══════════════════════════════════════════════════════════════════ function handleTrip(ctx: MessageContext): AgentResponse { return { blocks: [ { type: "header", text: { type: "plain_text", text: "✈️ Planification de voyage" }, }, { type: "section", text: { type: "mrkdwn", text: Bien reçu *${ctx.user}* ! Je prépare un itinéraire complet.\n\n + _Skill activé :_ \plan_a_trip``, }, }, { type: "context", elements: [ { type: "mrkdwn", text: "— EVE (DGK)" }, ], }, ], fallbackText: "Planification de voyage en cours", }; }
function handleWeather(ctx: MessageContext): AgentResponse { return { blocks: [ { type: "header", text: { type: "plain_text", text: "🌤️ Météo temps réel" }, }, { type: "section", text: { type: "mrkdwn", text: ⏳ Récupération météo...\n\n_Tool activé :_ \get_weather``, }, }, ], fallbackText: "Météo en cours de récupération", }; }
function handleHelp(): AgentResponse { return { blocks: [ { type: "header", text: { type: "plain_text", text: "🤖 EVE — Aide" }, }, { type: "section", text: { type: "mrkdwn", text: "Ce que je peux faire :\n" + "• 💬 Discuter avec toi\n" + "• 🌤️ Météo temps réel\n" + "• ✈️ Planifier des voyages\n" + "• 🔍 Chercher des informations\n\n" + "Commandes :\n" + "• /eve help\n" + "• /eve ping\n" + "• /eve weather <ville>\n" + "• /eve trip <destination>\n" + "• /eve status", }, }, { type: "context", elements: [{ type: "mrkdwn", text: "— EVE (DGK)" }], }, ], fallbackText: "EVE help", }; }
function handleGeneral(ctx: MessageContext): AgentResponse { return { blocks: [ { type: "section", text: { type: "mrkdwn", text: Salut *${ctx.user}* ! 👋\n\nTu as dit : _"${ctx.text}"_\n\n + Je peux t'aider avec la météo, un voyage, ou juste discuter.\n + Tape \/eve help` pour voir toutes mes commandes.`, }, }, { type: "context", elements: [{ type: "mrkdwn", text: "— EVE (DGK)" }], }, ], fallbackText: "Salut !", }; }
