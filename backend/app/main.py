from dotenv import load_dotenv
load_dotenv()  # MUST be first - before any app imports that read env vars

from app.database.base import Base
from app.database.session import engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# ROUTER IMPORTS
from app.auth.routes import router as auth_router
from app.commodities.routes import router as commodities_router
from app.mandi.routes import router as mandis_router
from app.users.routes import router as users_router
# APP INIT (MUST COME BEFORE include_router)
app = FastAPI(
    title="AgriProfit API",
    description="Agricultural commodity price tracking and forecasting platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ROUTERS (AFTER app exists)
app.include_router(auth_router)
app.include_router(commodities_router)
app.include_router(mandis_router)
app.include_router(users_router)
# HEALTH CHECK
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
