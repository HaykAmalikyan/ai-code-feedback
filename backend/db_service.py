import os
import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from dotenv import load_dotenv
import datetime

load_dotenv()

db = None

FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")

if FIREBASE_CREDENTIALS_JSON:
    try:
        cred_dict = json.loads(FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized from environment variable.")
    except Exception as e:
        print(f"Failed to initialize Firebase from env var: {e}")

elif FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
    try:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized from file.")
    except Exception as e:
        print(f"Failed to initialize Firebase from file: {e}")

else:
    print("Warning: No Firebase credentials found. Database saves will be skipped.")

def get_user_id(first_name: str, last_name: str) -> str:
    return f"{first_name.strip().lower()}_{last_name.strip().lower()}"

def get_user_data(first_name: str, last_name: str) -> dict:
    if not db:
        return {"firstName": first_name, "lastName": last_name, "hasRated": False}
    try:
        user_id = get_user_id(first_name, last_name)
        user_ref = db.collection('users').document(user_id)
        doc = user_ref.get()
        if doc.exists:
            return doc.to_dict()
        return {"firstName": first_name, "lastName": last_name, "hasRated": False}
    except Exception as e:
        print(f"Error getting user from Firestore: {e}")
        return {"firstName": first_name, "lastName": last_name, "hasRated": False}

def save_session(session_data: dict):
    if not db:
        print(f"Mock Save to DB: {session_data}")
        return
        
    try:
        first_name = session_data.pop("firstName")
        last_name = session_data.pop("lastName")
        user_id = get_user_id(first_name, last_name)
        
        user_ref = db.collection('users').document(user_id)
        
        doc_snapshot = user_ref.get()
        if not doc_snapshot.exists:
            user_ref.set({
                "firstName": first_name,
                "lastName": last_name,
                "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "hasRated": False
            })
            
        user_ref.collection('sessions').add(session_data)
    except Exception as e:
        print(f"Error saving to Firestore: {e}")
        raise

def save_rating(first_name: str, last_name: str, rating_data: dict):
    if not db:
        print(f"Mock Save Rating to DB: {rating_data}")
        return

    try:
        user_id = get_user_id(first_name, last_name)
        user_ref = db.collection('users').document(user_id)
        
        doc_snapshot = user_ref.get()
        if not doc_snapshot.exists:
            user_ref.set({
                "firstName": first_name,
                "lastName": last_name,
                "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "hasRated": True
            })
        else:
            user_ref.update({"hasRated": True})
            
        user_ref.collection('rating').add(rating_data)
    except Exception as e:
        print(f"Error saving rating to Firestore: {e}")
        raise

def get_user_history(first_name: str, last_name: str) -> list:
    if not db:
        return []
    try:
        user_id = get_user_id(first_name, last_name)
        user_ref = db.collection('users').document(user_id)
        
        sessions_ref = user_ref.collection('sessions').order_by('timestamp', direction=firestore.Query.DESCENDING)
        docs = sessions_ref.stream()
        
        history = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            history.append(data)
            
        return history
    except Exception as e:
        print(f"Error getting history from Firestore: {e}")
        return []
