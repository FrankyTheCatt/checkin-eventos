from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# El .env vive en la raíz del repositorio (dos niveles sobre este archivo).
RAIZ = Path(__file__).resolve().parents[2]

# Orígenes de la app Android (Capacitor): siempre permitidos, con o sin CORS_ORIGINS.
ORIGENES_MOVIL = ("https://localhost", "capacitor://localhost")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=RAIZ / ".env", extra="ignore")

    database_url: str
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    cors_origins: str = "http://localhost:4200,http://127.0.0.1:4200,https://localhost,capacitor://localhost"

    @property
    def cors_origins_list(self) -> list[str]:
        configurados = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        return list(dict.fromkeys([*configurados, *ORIGENES_MOVIL]))


@lru_cache
def get_settings() -> Settings:
    return Settings()
