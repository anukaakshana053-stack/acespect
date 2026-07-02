"""Runtime configuration, loaded from the environment."""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
    # Stub mode: deterministic fake outputs, no API calls. On when no key, or forced.
    stub_mode: bool = (not anthropic_api_key) or os.getenv("STUB_MODE") == "1"

    model_form: str = os.getenv("MODEL_FORM", "claude-haiku-4-5")
    model_photo: str = os.getenv("MODEL_PHOTO", "claude-sonnet-4-6")
    model_risk: str = os.getenv("MODEL_RISK", "claude-opus-4-8")
    model_summary: str = os.getenv("MODEL_SUMMARY", "claude-opus-4-8")

    port: int = int(os.getenv("PORT", "8000"))


settings = Settings()
