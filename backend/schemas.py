from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
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
