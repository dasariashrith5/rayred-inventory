from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
import database_models
from database import SessionLocal, engine
import schemas
from typing import List
import traceback
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Only create tables if DATABASE_URL is set (skip on startup if using pre-deploy migration)
import os
if os.getenv("DATABASE_URL"):
    try:
        database_models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"Could not create tables on startup: {e}")

app = FastAPI()

# Add exception handler for debugging
@app.exception_handler(Exception)
async def debug_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    raise exc

# Helpful root route: redirect to the interactive API docs
@app.get("/")
def root():
    return RedirectResponse(url="/docs")

# Prevent noisy favicon 404s by returning an empty successful response
@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)

# CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    # During local development allow the frontend dev server origins.
    # Use a more restrictive list in production.
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/articles/", response_model=List[schemas.ProductResponse])
def get_all_articles(db: Session = Depends(get_db)):
    articles = db.query(database_models.Product).all()
    return articles


@app.get("/articles/{article_id}", response_model=schemas.ProductResponse)
def get_article_by_id(article_id: int, db: Session = Depends(get_db)):
    article = db.query(database_models.Product).filter(database_models.Product.id == article_id).first()
    if article:
        return article
    raise HTTPException(status_code=404, detail="Article not found")

@app.post("/articles/", response_model=schemas.ProductResponse, status_code=201)
def create_article(article: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_article = database_models.Product(**article.model_dump())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

@app.put("/articles/{article_id}", response_model=schemas.ProductResponse)
def update_article(article_id: int, article: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_article = db.query(database_models.Product).filter(database_models.Product.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    updates = article.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(db_article, key, value)
    db.commit()
    db.refresh(db_article)
    return db_article


@app.delete("/articles/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db)):
    db_article = db.query(database_models.Product).filter(database_models.Product.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(db_article)
    db.commit()
    return {"message": "Article deleted successfully"}