from pydantic import BaseModel
from datetime import date
from typing import Optional

class UserBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    birthday: date
    job_title: Optional[str] = None
    gender: str
    weight_kg: Optional[float] = None
    height_cm: int 

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class UserProfileBase(BaseModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfile(UserProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True