from sqlalchemy import Column, Integer, String, Date, Float, Enum
from .database import Base
import enum

class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    middle_name = Column(String)
    last_name = Column(String, nullable=False)
    birthday = Column(Date)
    job_title = Column(String)
    gender = Column(Enum(GenderEnum))
    height_cm = Column(Integer)
    weight_kg = Column(Float)      # in kilograms
