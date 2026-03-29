from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import Header, HTTPException

from .config import settings


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail='Missing Authorization header.')

    scheme, _, token = authorization.partition(' ')
    if scheme.lower() != 'bearer' or not token.strip():
        raise HTTPException(status_code=401, detail='Invalid Authorization header format.')

    return token.strip()


def verify_supabase_access_token(token: str) -> dict:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(status_code=503, detail='Supabase auth verification is not configured.')

    endpoint = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    request = Request(
        endpoint,
        headers={
            'Authorization': f'Bearer {token}',
            'apikey': settings.supabase_anon_key,
        },
        method='GET',
    )

    try:
        with urlopen(request, timeout=8) as response:
            payload = response.read().decode('utf-8')
            return json.loads(payload)
    except HTTPError as error:
        if error.code in {401, 403}:
            raise HTTPException(status_code=401, detail='Invalid or expired token.') from None
        raise HTTPException(status_code=502, detail='Supabase auth verification failed.') from None
    except URLError:
        raise HTTPException(status_code=502, detail='Unable to reach Supabase auth service.') from None


def require_authenticated_user(
    authorization: str | None = Header(default=None),
    access_token: str | None = None,
) -> dict:
    token = access_token.strip() if access_token else _extract_bearer_token(authorization)
    return verify_supabase_access_token(token)
