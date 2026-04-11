import os
from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB  = os.getenv("MONGO_DB", "innovevents_logs")
_client = None

def get_mongo_db():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URL)
    return _client[MONGO_DB]

def log_action(type_action: str, id_utilisateur, details: dict):
    from datetime import datetime, timezone
    try:
        db = get_mongo_db()
        db["logs"].insert_one({
            "horodatage"     : datetime.now(timezone.utc),
            "type_action"    : type_action,
            "id_utilisateur" : id_utilisateur,
            "details"        : details,
        })
    except Exception as e:
        print(f"[MongoDB] Erreur log : {e}")