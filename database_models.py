

from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Product(Base):
    __tablename__ = "article_db"

    ID = Column(Integer, primary_key=True, index=True)
    ARTICLE = Column(String(255), index=True)
    SIZE = Column(String(100))
    price = Column(Integer)
    quantity = Column(Integer)
