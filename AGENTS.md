# Eve Agent App

This project uses the Eve framework. Before writing code, always read the relevant guide in `node_modules/eve/dist/docs/public/`.
AGENTS.md — EVE.SLACK
Agents disponibles
1. EVE (assistant principal)
Rôle : Assistant Slack conversationnel
Capacités : répondre, chercher, planifier, exécuter des tools
Modèle : GPT-4 / Claude / DeepSeek (configurable)
Entrée : slack.ts
Instructions : instructions.md
2. PLAN A TRIP (skill)
Rôle : Planification de voyages
Capacités : itinéraires, budgets, réservations
Entrée : skills/plan_a_trip.md
3. WEATHER AGENT (tool)
Rôle : Récupération météo temps réel
Capacités : OpenWeather, WeatherAPI
Entrée : tools/get_weather.ts
4. CHANNELS ROUTER
Rôle : Router les messages Slack par channel
Entrée : channels/index.ts
Protocole de communication
Slack → slack.ts → Agent → agent.ts → Skills/Tools
Réponses formatées en Block Kit Slack
Persistance : SQLite (optionnel) ou mémoire
Configuration
Variables d'environnement :
SLACK_BOT_TOKEN
SLACK_SIGNING_SECRET
SLACK_APP_TOKEN
OPENAI_API_KEY ou ANTHROPIC_API_KEY ou DEEPSEEK_API_KEY
WEATHER_API_KEY
