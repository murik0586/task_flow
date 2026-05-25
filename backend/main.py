from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.ml import router as ml_router
from app.api.v1.endpoints.tasks import router as tasks_router
from app.api.v1.endpoints.categories import router as categories_router
API_V1_PREFIX = "/api/v1"

app = FastAPI(
    title="Task Flow API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(tasks_router, prefix=API_V1_PREFIX)
app.include_router(ml_router, prefix=API_V1_PREFIX)

app.include_router(categories_router, prefix=API_V1_PREFIX)


@app.get("/")
async def root():
    return {"service": "task-flow-api", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok"}
