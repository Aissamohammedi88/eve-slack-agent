@AGENTS.md
CLAUDE.md — Contexte pour assistants IA
Projet
EVE.SLACK — Agent Slack autonome avec skills et tools.
Architecture
Runtime : Node.js 20+ / TypeScript
Framework Slack : Bolt.js
Déploiement : Vercel / local
Module système : ESM ("type": "module")
Conventions de code
TypeScript strict
Imports en @skills/*, @tools/*, @channels/*
Aucune dépendance circulaire
Chaque skill = 1 fichier Markdown + 1 index TypeScript
Chaque tool = 1 fichier TypeScript exportant execute()
Fichiers clés
slack.ts — point d'entrée Slack Bolt
agent.ts — logique de l'agent (routing, mémoire)
instructions.md — system prompt d'EVE
channels/index.ts — routing multi-channels
skills/index.ts — registre des skills
tools/index.ts — registre des tools
Commande de dev
pnpm install
pnpm dev
