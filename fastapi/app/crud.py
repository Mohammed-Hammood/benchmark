from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import User
from .schemas import UserCreate

async def get_users(db: AsyncSession, limit: int = 100):
    result = await db.execute(select(User).limit(limit))
    return result.scalars().all()

async def create_user(db: AsyncSession, user: UserCreate):
    db_user = User(**user.model_dump())
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user