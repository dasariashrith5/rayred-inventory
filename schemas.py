from pydantic import BaseModel, EmailStr
from typing import Optional, List

# Base schema
class ProductBase(BaseModel):
    article: str
    size: str
    price: int
    quantity: int

# Schema for creating a product
class ProductCreate(ProductBase):
    pass

# Schema for updating a product (all fields optional)
class ProductUpdate(BaseModel):
    article: Optional[str] = None
    size: Optional[str] = None
    price: Optional[int] = None
    quantity: Optional[int] = None

# Schema for response
class ProductResponse(ProductBase):
    id: int
    
    # Pydantic v2: use `model_config` to allow reading attributes from ORM objects
    model_config = {"from_attributes": True}