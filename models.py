
from pydantic import BaseModel
from typing import Optional


class Product(BaseModel):
    ID: Optional[int] = None
    ARTICLE: str
    SIZE: str
    price: int
    quantity: int

   