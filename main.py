from fastapi import FastAPI, Depends, HTTPException
from fastapi. middleware. cors import CORSMiddleware
from sqlalchemy.orm import Session
import database_models
from database import SessionLocal, engine
from models import Product
import os

# Create tables safely
try:
    database_models.Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"⚠️ Database table creation warning: {e}")

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        ...
    ],

]



def init_db():
    try:
        db = SessionLocal()
        try:
            existing_count = db.query(database_models.Product).count()
            print(f"✅ Database connected, found {existing_count} articles")
            
            if existing_count == 0:
                print("📝 Initializing database with sample articles...")
                for article in articles:
                    db.add(database_models.Product(**article.model_dump()))
                db.commit()
                print("✅ Sample articles added successfully")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ Database initialization error (non-critical): {e}")
        print("⏭️ Continuing anyway - database will be created on first request")

# Initialize database on startup
init_db()

@app.get("/")
def read_root():
    return {"message": "RAYRED Inventory API is running"}

@app.get("/articles/")
def get_all_articles(db: Session = Depends(get_db)):
    articles = db.query(database_models.Product).all()
    return articles


@app.get("/articles/{article_id}")
def get_article_by_id(article_id: int, db: Session = Depends(get_db)):
    article = db.query(database_models.Product).filter(database_models.Product.ID == article_id).first()
    if article:
        return article
    return {"error": "Article not found"}

@app.post("/articles/")
def create_article(article: Product, db: Session = Depends(get_db)):
    db.add(database_models.Product(**article.model_dump()))
    db.commit()
    return {"message": "Article created successfully", "article": article}

@app.put("/articles/{article_id}")
def update_article(article_id: int, article: Product, db: Session = Depends(get_db)):
    db_article = db.query(database_models.Product).filter(database_models.Product.ID == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    db_article.ARTICLE = article.ARTICLE
    db_article.SIZE = article.SIZE
    db_article.price = article.price
    db_article.quantity = article.quantity
    db.commit()
    db.refresh(db_article)
    return {"message": "Article updated successfully", "article": db_article}


@app.delete("/articles/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db)):
    db_article = db.query(database_models.Product).filter(database_models.Product.ID == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(db_article)
    db.commit()
    return {"message": "Article deleted successfully"}
