
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Product(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article = Column(String(100), index=True)
    size = Column(String(255), index=True)
    price = Column(Integer)
    quantity = Column(Integer)