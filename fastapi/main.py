from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import time
import random
import os
import json

app = FastAPI(title="Python/FastAPI Benchmark")

# ==========================================
# GLOBAL CONFIGURATION (100 records)
# ==========================================
NAME_GENDER_POOL = (
    {"name": "James", "gender": "M"}, {"name": "John", "gender": "M"}, {"name": "Robert", "gender": "M"}, {"name": "Michael", "gender": "M"}, {"name": "William", "gender": "M"}, {"name": "David", "gender": "M"}, {"name": "Richard", "gender": "M"}, {"name": "Joseph", "gender": "M"}, {"name": "Thomas", "gender": "M"}, {"name": "Charles", "gender": "M"}, {"name": "Christopher", "gender": "M"}, {"name": "Daniel", "gender": "M"}, {"name": "Matthew", "gender": "M"}, {"name": "Anthony", "gender": "M"}, {"name": "Mark", "gender": "M"}, {"name": "Donald", "gender": "M"}, {"name": "Steven", "gender": "M"}, {"name": "Paul", "gender": "M"}, {"name": "Andrew", "gender": "M"}, {"name": "Joshua", "gender": "M"}, {"name": "Kenneth", "gender": "M"}, {"name": "Kevin", "gender": "M"}, {"name": "Brian", "gender": "M"}, {"name": "George", "gender": "M"}, {"name": "Timothy", "gender": "M"}, {"name": "Ronald", "gender": "M"}, {"name": "Edward", "gender": "M"}, {"name": "Jason", "gender": "M"}, {"name": "Jeffrey", "gender": "M"}, {"name": "Ryan", "gender": "M"}, {"name": "Jacob", "gender": "M"}, {"name": "Gary", "gender": "M"}, {"name": "Nicholas", "gender": "M"}, {"name": "Eric", "gender": "M"}, {"name": "Jonathan", "gender": "M"}, {"name": "Stephen", "gender": "M"}, {"name": "Larry", "gender": "M"}, {"name": "Justin", "gender": "M"}, {"name": "Scott", "gender": "M"}, {"name": "Brandon", "gender": "M"}, {"name": "Benjamin", "gender": "M"}, {"name": "Samuel", "gender": "M"}, {"name": "Raymond", "gender": "M"}, {"name": "Gregory", "gender": "M"}, {"name": "Frank", "gender": "M"}, {"name": "Alexander", "gender": "M"}, {"name": "Patrick", "gender": "M"}, {"name": "Jack", "gender": "M"}, {"name": "Dennis", "gender": "M"}, {"name": "Jerry", "gender": "M"},
    {"name": "Mary", "gender": "F"}, {"name": "Patricia", "gender": "F"}, {"name": "Jennifer", "gender": "F"}, {"name": "Linda", "gender": "F"}, {"name": "Barbara", "gender": "F"}, {"name": "Elizabeth", "gender": "F"}, {"name": "Susan", "gender": "F"}, {"name": "Jessica", "gender": "F"}, {"name": "Sarah", "gender": "F"}, {"name": "Karen", "gender": "F"}, {"name": "Lisa", "gender": "F"}, {"name": "Nancy", "gender": "F"}, {"name": "Betty", "gender": "F"}, {"name": "Margaret", "gender": "F"}, {"name": "Sandra", "gender": "F"}, {"name": "Ashley", "gender": "F"}, {"name": "Dorothy", "gender": "F"}, {"name": "Kimberly", "gender": "F"}, {"name": "Emily", "gender": "F"}, {"name": "Donna", "gender": "F"}, {"name": "Michelle", "gender": "F"}, {"name": "Carol", "gender": "F"}, {"name": "Amanda", "gender": "F"}, {"name": "Melissa", "gender": "F"}, {"name": "Deborah", "gender": "F"}, {"name": "Stephanie", "gender": "F"}, {"name": "Rebecca", "gender": "F"}, {"name": "Sharon", "gender": "F"}, {"name": "Laura", "gender": "F"}, {"name": "Cynthia", "gender": "F"}, {"name": "Kathleen", "gender": "F"}, {"name": "Amy", "gender": "F"}, {"name": "Angela", "gender": "F"}, {"name": "Shirley", "gender": "F"}, {"name": "Anna", "gender": "F"}, {"name": "Brenda", "gender": "F"}, {"name": "Pamela", "gender": "F"}, {"name": "Emma", "gender": "F"}, {"name": "Nicole", "gender": "F"}, {"name": "Helen", "gender": "F"}, {"name": "Samantha", "gender": "F"}, {"name": "Katherine", "gender": "F"}, {"name": "Christine", "gender": "F"}, {"name": "Debra", "gender": "F"}, {"name": "Rachel", "gender": "F"}, {"name": "Carolyn", "gender": "F"}, {"name": "Janet", "gender": "F"}, {"name": "Catherine", "gender": "F"}, {"name": "Maria", "gender": "F"}, {"name": "Heather", "gender": "F"}
)

# ==========================================
# 1. MATH CALCULATION ENDPOINT
# ==========================================
@app.get("/api/math")
def run_math_calculation(n: int = Query(..., ge=1000, le=1000_000_000)):
    start_time = time.perf_counter()
    total_sum = 0
    
    for i in range(n):
        if i % 2 == 0:
            total_sum += 1
        else:
            total_sum += i % 10
        total_sum += random.randint(1, 1000)
            
    end_time = time.perf_counter()
    elapsed_ms = (end_time - start_time) * 1000

    return JSONResponse(content={
        "status": "success",
        "test_type": "math_calculation",
        "n": n,
        "result": total_sum,
        "execution_time_ms": round(elapsed_ms, 2)
    })

# ==========================================
# 2. DATA GENERATION ENDPOINT
# ==========================================
@app.get("/api/generate")
def generate_user_data(n: int = Query(..., ge=1000, le=1000000)):
    start_time = time.perf_counter()
    
    os.makedirs("generated_data", exist_ok=True)
    filename = f"users_{n}.json"
    filepath = os.path.join("generated_data", filename)
    
    users = []
    for i in range(1, n + 1):
        chosen_pair = random.choice(NAME_GENDER_POOL)
        user = {
            "id": i,
            "name": chosen_pair["name"],
            "gender": chosen_pair["gender"],
            "age": random.randint(15, 90)
        }
        users.append(user)
            
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(users, f)
            
    end_time = time.perf_counter()
    elapsed_ms = (end_time - start_time) * 1000

    return JSONResponse(content={
        "status": "success",
        "test_type": "data_generation",
        "n": n,
        "file_saved": filename,
        "execution_time_ms": round(elapsed_ms, 2)
    })
