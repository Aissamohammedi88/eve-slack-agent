from dotenv import load_dotenv
import os

# Charge le fichier .env (le chemin est relatif au fichier script)
load_dotenv()

# Vérification de sécurité
if not os.getenv("SLACK_BOT_TOKEN"):
    raise ValueError("SLACK_BOT_TOKEN manquant dans le fichier .env")

if not os.getenv("SLACK_APP_TOKEN"):
    raise ValueError("SLACK_APP_TOKEN manquant dans le fichier .env")
