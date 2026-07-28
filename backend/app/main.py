"""FastAPI application entry point for SmartHire AI backend."""

from __future__ import annotations

import time

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import RequestResponseEndpoint

from app.api.router import create_api_router
from app.api.v1.endpoints.root import router as root_router
from app.core.config import get_settings
from app.core.lifespan import lifespan
from app.core.logging import configure_logging, logger_factory
from app.middleware.exception_handler import register_exception_handlers


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance.

    Returns:
        The configured FastAPI application.
    """

    settings = get_settings()
    configure_logging(settings)

    application = FastAPI(
        title=settings.app_name,
        description="SmartHire AI backend foundation.",
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Register exception handlers
    register_exception_handlers(application)

    # ── Custom HTTP middleware (skip OPTIONS preflight requests) ──
    @application.middleware("http")
    async def log_requests(request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        if request.method != "OPTIONS":
            logger = logger_factory("app.middleware.request")
            logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
        return response

    @application.middleware("http")
    async def add_process_time_header(request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.6f}"
        return response

    # ── CORS — must be added LAST so it is the outermost middleware ──
    raw_origins = settings.cors_allowed_origins
    if isinstance(raw_origins, (list, tuple, set)):
        origins_list = [str(o) for o in raw_origins]
    else:
        origins_list = [str(raw_origins)]

    # When allow_credentials=True, W3C spec forbids wildcard '*'.
    # Use allow_origin_regex to dynamically echo requesting origin for Render & localhost.
    has_wildcard = "*" in origins_list
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[] if has_wildcard else origins_list,
        allow_origin_regex=r"https://.*\.onrender\.com|http://localhost:\d+|http://127\.0\.0\.1:\d+" if has_wildcard else None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )


    application.include_router(create_api_router(settings.api_v1_prefix))
    application.include_router(root_router)

    return application


app = create_app()


def main() -> None:
    """Run the development application server."""

    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()