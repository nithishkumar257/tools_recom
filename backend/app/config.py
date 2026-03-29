from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / '.env')


class Settings:
    app_name: str = 'ai-brutal-core-api-python'
    host: str = os.getenv('HOST', '0.0.0.0')
    port: int = int(os.getenv('PORT', '4002'))
    cors_origin: str = os.getenv('CORS_ORIGIN', '*')
    database_url: str | None = os.getenv('DATABASE_URL')
    database_ssl: bool = os.getenv('DATABASE_SSL', 'false').lower() == 'true'
    database_connect_timeout: int = int(os.getenv('DATABASE_CONNECT_TIMEOUT', '3'))
    supabase_url: str | None = os.getenv('SUPABASE_URL')
    supabase_anon_key: str | None = os.getenv('SUPABASE_ANON_KEY')
    web_push_public_key: str | None = os.getenv('WEB_PUSH_PUBLIC_KEY')
    web_push_private_key: str | None = os.getenv('WEB_PUSH_PRIVATE_KEY')
    web_push_subject: str = os.getenv('WEB_PUSH_SUBJECT', 'mailto:admin@aibrutal.local')
    web_push_max_retries: int = int(os.getenv('WEB_PUSH_MAX_RETRIES', '2'))
    web_push_alert_success_threshold: float = float(os.getenv('WEB_PUSH_ALERT_SUCCESS_THRESHOLD', '60'))
    web_push_auto_pause_streak: int = int(os.getenv('WEB_PUSH_AUTO_PAUSE_STREAK', '3'))
    web_push_resume_cooldown_minutes: int = int(os.getenv('WEB_PUSH_RESUME_COOLDOWN_MINUTES', '30'))
    web_push_resume_healthy_threshold: float = float(os.getenv('WEB_PUSH_RESUME_HEALTHY_THRESHOLD', '70'))
    web_push_resume_min_campaigns: int = int(os.getenv('WEB_PUSH_RESUME_MIN_CAMPAIGNS', '3'))
    web_push_auto_resume_enabled: bool = os.getenv('WEB_PUSH_AUTO_RESUME_ENABLED', 'false').lower() == 'true'
    web_push_auto_resume_checks: int = int(os.getenv('WEB_PUSH_AUTO_RESUME_CHECKS', '2'))
    web_push_auto_resume_locked: bool = os.getenv('WEB_PUSH_AUTO_RESUME_LOCKED', 'true').lower() == 'true'


settings = Settings()
