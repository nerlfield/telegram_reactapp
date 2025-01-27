from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
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

# Create tables
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

@app.get("/scores/{user_id}")
async def get_user_score(user_id: int, db: Session = Depends(get_db)):
    user_score = db.query(UserScore).filter(UserScore.user_id == user_id).first()
    if not user_score:
        return {"highest_score": 0}
    return {"highest_score": user_score.highest_score}

@app.post("/scores")
async def save_score(user_id: int, score: int, db: Session = Depends(get_db)):
    user_score = db.query(UserScore).filter(UserScore.user_id == user_id).first()
    
    if user_score:
        if score > user_score.highest_score:
            user_score.highest_score = score
    else:
        user_score = UserScore(user_id=user_id, highest_score=score)
        db.add(user_score)
    
    db.commit()
    return {"message": "Score saved", "highest_score": user_score.highest_score} 