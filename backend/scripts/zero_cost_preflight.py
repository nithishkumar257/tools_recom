from __future__ import annotations

from pathlib import Path
import os
import sys
from urllib.parse import urlparse

from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = ROOT.parent

load_dotenv(ROOT / '.env')
load_dotenv(WORKSPACE_ROOT / '.env')


def _is_local_database_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
        host = (parsed.hostname or '').lower()
        return host in {'localhost', '127.0.0.1', '::1'}
    except Exception:
        return False


def main() -> int:
    checks: list[tuple[str, str]] = []
    warnings = 0

    database_url = (os.getenv('DATABASE_URL') or '').strip()
    if not database_url:
        checks.append(('PASS', 'DATABASE_URL is not set. Local/in-memory fallback mode is active.'))
    elif _is_local_database_url(database_url):
        checks.append(('PASS', 'DATABASE_URL points to local database host. Still zero-cost self-hostable.'))
    else:
        warnings += 1
        checks.append(('WARN', 'DATABASE_URL points to non-local host. This may introduce hosting cost.'))

    supabase_url = (os.getenv('SUPABASE_URL') or '').strip()
    supabase_key = (os.getenv('SUPABASE_ANON_KEY') or '').strip()
    if not supabase_url and not supabase_key:
        checks.append(('PASS', 'Supabase auth vars are not set. Public zero-cost flows remain available.'))
    elif supabase_url and supabase_key:
        checks.append(('INFO', 'Supabase auth is configured (optional; free tier can be used).'))
    else:
        warnings += 1
        checks.append(('WARN', 'Supabase auth is partially configured. Set both URL and anon key or neither.'))

    web_push_public = (os.getenv('WEB_PUSH_PUBLIC_KEY') or '').strip()
    web_push_private = (os.getenv('WEB_PUSH_PRIVATE_KEY') or '').strip()
    if not web_push_public and not web_push_private:
        checks.append(('PASS', 'Web Push keys are not set. Push stays in simulation mode (zero-cost safe).'))
    elif web_push_public and web_push_private:
        checks.append(('INFO', 'Web Push keys are configured (optional).'))
    else:
        warnings += 1
        checks.append(('WARN', 'Web Push keys are partially configured. Set both keys or neither.'))

    vite_supabase_url = (os.getenv('VITE_SUPABASE_URL') or '').strip()
    vite_supabase_key = (os.getenv('VITE_SUPABASE_ANON_KEY') or '').strip()
    if (vite_supabase_url and not vite_supabase_key) or (vite_supabase_key and not vite_supabase_url):
        warnings += 1
        checks.append(('WARN', 'Frontend Supabase vars are partially configured. Set both VITE vars or neither.'))
    elif vite_supabase_url and vite_supabase_key:
        checks.append(('INFO', 'Frontend Supabase vars are configured.'))
    else:
        checks.append(('PASS', 'Frontend Supabase vars are not set. App can still run public zero-cost flows.'))

    print('=== AI Brutal Zero-Cost Preflight ===')
    for status, message in checks:
        print(f'[{status}] {message}')

    if warnings:
        print(f'\nCompleted with {warnings} warning(s). Review WARN items to stay strictly zero-cost.')
        return 1

    print('\nZero-cost preflight passed. Configuration is aligned for zero-cost operation.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
