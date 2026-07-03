"""FastAPI application entry point for SmartHire AI backend."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import create_api_router
from app.api.v1.endpoints.root import router as root_router
from app.core.config import get_settings
from app.core.lifespan import lifespan
from app.core.logging import configure_logging
from app.middleware.exception_handler import register_exception_handlers
from app.middleware.process_time import process_time_middleware
from app.middleware.request_logging import request_logging_middleware


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

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(create_api_router(settings.api_v1_prefix))
    application.include_router(root_router)

    application.middleware("http")(request_logging_middleware)
    application.middleware("http")(process_time_middleware)

    register_exception_handlers(application)

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