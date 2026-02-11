"""
Main application entry point.
"""

import logging
import os
import time
import uuid

from fastapi import FastAPI
from fastapi import Request
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.responses import Response

import config
from .api import router

# Basic logging setup (stdout)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("medsight.api")

# Initialize FastAPI app
app = FastAPI(title="DICOM Processing Backend")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    # Dev-friendly localhost + 127.0.0.1 variants + Docker service
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://frontend:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/response logging (outermost middleware so we also see CORS short-circuits)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id

    origin = request.headers.get("origin")
    acr_method = request.headers.get("access-control-request-method")
    acr_headers = request.headers.get("access-control-request-headers")

    start = time.perf_counter()
    try:
        response: Response = await call_next(request)
    except Exception:
        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.exception(
            "request_failed request_id=%s method=%s path=%s duration_ms=%s origin=%s acr_method=%s acr_headers=%s",
            request_id,
            request.method,
            request.url.path,
            duration_ms,
            origin,
            acr_method,
            acr_headers,
        )
        raise

    duration_ms = int((time.perf_counter() - start) * 1000)
    response.headers["X-Request-Id"] = request_id

    # Always log OPTIONS + any non-2xx for debugging preflight + failures
    if request.method == "OPTIONS" or response.status_code >= 400:
        logger.warning(
            "request_done request_id=%s method=%s path=%s status=%s duration_ms=%s origin=%s acr_method=%s acr_headers=%s",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            origin,
            acr_method,
            acr_headers,
        )
    else:
        logger.info(
            "request_done request_id=%s method=%s path=%s status=%s duration_ms=%s",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )

    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        "validation_error request_id=%s method=%s path=%s errors=%s",
        request_id,
        request.method,
        request.url.path,
        exc.errors(),
    )
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "requestId": request_id},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", None)
    # Log 4xx/5xx with context for easier debugging (auth/CORS/etc.)
    logger.info(
        "http_exception request_id=%s method=%s path=%s status=%s detail=%s",
        request_id,
        request.method,
        request.url.path,
        exc.status_code,
        exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "requestId": request_id},
        headers=getattr(exc, "headers", None),
    )


# Include API routes
app.include_router(router)

@app.on_event("startup")
async def _log_startup_config():
    logger.info("startup log_level=%s", LOG_LEVEL)
    logger.info(
        "startup cors_allow_origins=%s allow_credentials=%s allow_methods=%s allow_headers=%s",
        [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
            "http://frontend:80",
        ],
        True,
        ["*"],
        ["*"],
    )


@app.get("/")
async def root():
    """Public endpoint - no authentication required."""
    return {
        "message": "DICOM Processing Backend API",
        "status": "running",
        "endpoints": {
            "auth_check": "/api/auth/check"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
