/**
Skills Registry — Registre des skills EVE
Aissa Amohammedi (DGK) */
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export interface Skill { name: string; description: string; content: string; triggers: string[]; }
// ═══════════════════════════════════════════════════════════════════ // CHARGEMENT DES SKILLS DEPUIS LE DISQUE // ═══════════════════════════════════════════════════════════════════ const SKILL_TRIGGERS: Record<string, string[]> = { plan_a_trip: ["voyage", "trip", "itinéraire", "destination", "planifie"], };
export function loadSkill(name: string): Skill | null { const p = path.join(__dirname, ${name}.md); try { const content = fs.readFileSync(p, "utf-8"); return { name, description: content.split("\n")[0].replace(/^#\s*/, ""), content, triggers: SKILL_TRIGGERS[name] || [], }; } catch { return null; } }
export function listSkills(): string[] { try { return fs .readdirSync(__dirname) .filter((f) => f.endsWith(".md")) .map((f) => f.replace(/.md$/, "")); } catch { return []; } }
export function findSkillForMessage(text: string): Skill | null { const t = text.toLowerCase(); for (const [skillName, triggers] of Object.entries(SKILL_TRIGGERS)) { if (triggers.some((trg) => t.includes(trg))) { return loadSkill(skillName); } } return null; }
