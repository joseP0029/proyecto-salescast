from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum

class RoleEnum(str, Enum):
    admin = "admin"
    analyst = "analyst"

class OrganizationBase(BaseModel):
    name: str

class Organization(OrganizationBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr

class UserRegister(UserBase):
    password: str
    organization_name: str 

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: RoleEnum
    organization_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class UserWithOrgResponse(UserResponse):
    organization: Organization

class Token(BaseModel):
    access_token: str
    token_type: str

class DatasetResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

class ModelResponse(BaseModel):
    id: int
    dataset_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class PredictionRequest(BaseModel):
    model_id: int
    days_to_predict: int

class PredictionResponse(BaseModel):
    target_date: datetime
    store_nbr: Optional[int] = None
    family: Optional[str] = None
    predicted_value: float
    class Config:
        from_attributes = True
