# utils.py (or add to main.py)

import random
from datetime import date, timedelta
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from .models import User, GenderEnum
from .database import get_db  # if needed elsewhere

# ----------------------------
# DATA LISTS (50+ entries each)
# ----------------------------

# Format: [gender, first_name]
list_names: List[Tuple[str, str]] = [
    ('m', "Ali"), ('m', "Saif"), ('m', "Mohammed"), ('m', "Ahmed"), ('m', "Omar"),
    ('m', "Yusuf"), ('m', "Ibrahim"), ('m', "Khalid"), ('m', "Hassan"), ('m', "Hussein"),
    ('m', "Abdullah"), ('m', "Abdulrahman"), ('m', "Faisal"), ('m', "Tariq"), ('m', "Nasser"),
    ('m', "Zaid"), ('m', "Malik"), ('m', "Rashid"), ('m', "Saeed"), ('m', "Adel"),
    ('m', "Bilal"), ('m', "Faris"), ('m', "Jasim"), ('m', "Majid"), ('m', "Qasim"),
    ('f', "Sahir"), ('f', "Fatima"), ('f', "Aisha"), ('f', "Noor"), ('f', "Layla"),
    ('f', "Zahra"), ('f', "Mariam"), ('f', "Salma"), ('f', "Amira"), ('f', "Yasmin"),
    ('f', "Leila"), ('f', "Noura"), ('f', "Huda"), ('f', "Rania"), ('f', "Sara"),
    ('f', "Dana"), ('f', "Mona"), ('f', "Reem"), ('f', "Asma"), ('f', "Wafa"),
    ('f', "Iman"), ('f', "Joud"), ('f', "Rawan"), ('f', "Shaima"), ('f', "Hanan"),
    ('f', "Ghada"), ('f', "Nadia"), ('f', "Samira"), ('f', "Bushra"), ('f', "Khadija")
]

last_names: List[str] = [
    "Kalidy", "Mohammedy", "Mansuri", "Al-Harbi", "Al-Saud", "Al-Qahtani", "Al-Ghamdi",
    "Al-Dossary", "Al-Shammari", "Al-Zahrani", "Al-Rashidi", "Al-Otaibi", "Al-Balawi",
    "Al-Hamed", "Al-Juhani", "Al-Mutairi", "Al-Nasser", "Al-Sulaiman", "Al-Turki",
    "Al-Yami", "Al-Zaidi", "Al-Ajmi", "Al-Bishi", "Al-Dawood", "Al-Fawaz",
    "Al-Ghanim", "Al-Habib", "Al-Khalaf", "Al-Lahim", "Al-Malki", "Al-Nuaimi",
    "Al-Rajhi", "Al-Sadhan", "Al-Tamimi", "Al-Utaybi", "Al-Wazzan", "Al-Yousef",
    "Al-Zamil", "Al-Abdali", "Al-Baqami", "Al-Deghaither", "Al-Fayez", "Al-Ghothani",
    "Al-Humaid", "Al-Khudair", "Al-Majid", "Al-Nafisi", "Al-Rumaih", "Al-Suwaidi"
]

middle_names: List[str] = [
    "Abdul", "Mohammed", "Ali", "Ahmed", "Omar", "Yusuf", "Ibrahim", "Khalid", "Hassan",
    "Hussein", "Abdullah", "Faisal", "Tariq", "Nasser", "Zaid", "Malik", "Rashid", "Saeed",
    "Adel", "Bilal", "Faris", "Jasim", "Majid", "Qasim", "Hamza", "Saad", "Saleh", "Waleed",
    "Yazeed", "Ziyad", "Amr", "Anas", "Ayman", "Basem", "Dawood", "Eissa", "Fahad", "Ghazi",
    "Hani", "Idris", "Jaber", "Karim", "Luay", "Mazen", "Nabil", "Osama", "Raed", "Sameer"
]

job_titles: List[str] = [
    "Software Engineer", "Data Scientist", "DevOps Engineer", "Frontend Developer",
    "Backend Developer", "Full Stack Developer", "QA Engineer", "Product Manager",
    "UX Designer", "UI Designer", "System Administrator", "Database Administrator",
    "Security Analyst", "Machine Learning Engineer", "AI Researcher", "Mobile Developer",
    "Game Developer", "Embedded Systems Engineer", "Cloud Architect", "Network Engineer",
    "Technical Writer", "IT Support Specialist", "Business Analyst", "Project Manager",
    "Scrum Master", "Data Analyst", "BI Developer", "Automation Engineer", "Researcher",
    "Professor", "Student", "Freelancer", "Entrepreneur", "Consultant", "Architect",
    "Electrician", "Mechanic", "Teacher", "Doctor", "Nurse", "Pharmacist", "Accountant",
    "Lawyer", "Journalist", "Photographer", "Musician", "Artist", "Writer", "Chef"
]

# ----------------------------
# POPULATION FUNCTION
# ----------------------------

async def populate_users(db: AsyncSession, n: int):
    """
    Populate the 'users' table with `n` randomly generated user records.
    
    Args:
        db (AsyncSession): SQLAlchemy async session
        n (int): Number of users to create
    
    Usage:
        In an endpoint or script:
        >>> from .utils import populate_users
        >>> await populate_users(db, 1000)
    """
    if n <= 0:
        return

    users_to_add = []

    for _ in range(n):
        # Pick random first name + infer gender
        gender_flag, first = random.choice(list_names)
        gender = GenderEnum.male if gender_flag == 'm' else GenderEnum.female

        # Random middle & last
        middle = random.choice(middle_names) if random.random() > 0.3 else None
        last = random.choice(last_names)

        # Random birthday (age 18–70)
        days_offset = random.randint(18 * 365, 70 * 365)
        birthday = date.today() - timedelta(days=days_offset)

        # Random height
        height_cm = random.randint(150, 205)
        # Random job and weight
        job = random.choice(job_titles)
        weight = round(random.uniform(45.0, 120.0), 1)

        # Create model instance
        user = User(
            first_name=first,
            middle_name=middle,
            last_name=last,
            birthday=birthday,
            job_title=job,
            gender=gender,
            weight_kg=weight,
            height_cm=height_cm
        )
        users_to_add.append(user)

    # Bulk insert
    db.add_all(users_to_add)
    await db.commit()

    print(f"✅ Successfully inserted {len(users_to_add)} users into the database.")