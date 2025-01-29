from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, BigInteger, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import os

# Database setup
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/snake_game")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class UserScore(Base):
    __tablename__ = "user_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, unique=True, index=True)
    highest_score = Column(Integer, default=0)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)

# Pydantic models
class ScoreSubmission(BaseModel):
    user_id: int
    score: int
    username: Optional[str] = None
    first_name: Optional[str] = None

class LeaderboardEntry(BaseModel):
    user_id: int
    highest_score: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    rank: int

# Drop all tables and recreate them
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Snake Game API"}

@app.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    try:
        # Get top scores ordered by highest_score
        top_scores = db.query(UserScore).order_by(desc(UserScore.highest_score)).limit(limit).all()
        
        # Convert to LeaderboardEntry with rank
        leaderboard = []
        for idx, score in enumerate(top_scores, 1):
            leaderboard.append(LeaderboardEntry(
                rank=idx,
                user_id=score.user_id,
                highest_score=score.highest_score,
                username=score.username,
                first_name=score.first_name
            ))
        
        return leaderboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scores/{user_id}")
async def get_user_score(user_id: int, db: Session = Depends(get_db)):
    try:
        user_score = db.query(UserScore).filter(UserScore.user_id == user_id).first()
        if not user_score:
            return {"highest_score": 0}
        return {"highest_score": user_score.highest_score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scores")
async def save_score(score_data: ScoreSubmission, db: Session = Depends(get_db)):
    try:
        user_score = db.query(UserScore).filter(UserScore.user_id == score_data.user_id).first()
        
        if user_score:
            if score_data.score > user_score.highest_score:
                user_score.highest_score = score_data.score
                # Update user info in case it changed
                user_score.username = score_data.username
                user_score.first_name = score_data.first_name
        else:
            user_score = UserScore(
                user_id=score_data.user_id, 
                highest_score=score_data.score,
                username=score_data.username,
                first_name=score_data.first_name
            )
            db.add(user_score)
        
        db.commit()
        return {"message": "Score saved", "highest_score": user_score.highest_score}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 