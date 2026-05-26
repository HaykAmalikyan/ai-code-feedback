from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import datetime

from ai_service import get_feedback
from db_service import save_session, get_user_data, save_rating, get_user_history

app = FastAPI(title="CodeFeedback API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeedbackRequest(BaseModel):
    firstName: str
    lastName: str
    code: str
    language: str = "Python"
    errors: list[str] = []

@app.post("/feedback")
async def process_feedback(request: FeedbackRequest):
    try:
        ai_response = await get_feedback(request.code, request.language, request.errors)
        
        session_data = {
            "firstName": request.firstName,
            "lastName": request.lastName,
            "submittedCode": request.code,
            "aiFeedback": ai_response.get("feedback", ""),
            "aiTips": ai_response.get("tips", ""),
            "score": ai_response.get("score", 0),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        try:
            save_session(session_data)
        except Exception as db_err:
            print(f"Warning: Failed to save to database. Error: {db_err}")
            
        return ai_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LoginRequest(BaseModel):
    firstName: str
    lastName: str

class RatingRequest(BaseModel):
    firstName: str
    lastName: str
    appRating: int
    knowledgeLevel: str
    feedback: str

@app.post("/login")
async def login(request: LoginRequest):
    return get_user_data(request.firstName, request.lastName)

@app.post("/rate")
async def rate_app(request: RatingRequest):
    try:
        rating_data = {
            "appRating": request.appRating,
            "knowledgeLevel": request.knowledgeLevel,
            "feedback": request.feedback,
            "hasRated": True,
            "ratedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        save_rating(request.firstName, request.lastName, rating_data)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{first_name}/{last_name}")
async def get_history(first_name: str, last_name: str):
    try:
        return get_user_history(first_name, last_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
