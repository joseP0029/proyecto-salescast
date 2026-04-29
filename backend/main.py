from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth

sentry_sdk.init(
    dsn="https://5f7d4adbaa21ac09bc45ccd00eb130f8@o4511303616823296.ingest.us.sentry.io/4511303639629824",
    send_default_pii=True,
    traces_sample_rate=1.0,
)

app = FastAPI(title="Sales Prediction API")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


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

@app.get("/sentry-debug")
async def trigger_error():
    1 / 0