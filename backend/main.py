from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sales Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite desde tu IP y desde localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/")
def read_root():
    return {"message": "Sales Prediction API is running"}
