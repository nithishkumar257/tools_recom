from __future__ import annotations

from contextlib import contextmanager

import psycopg

from .config import settings


class DatabaseState:
    enabled: bool = False
    last_error: str | None = None


db_state = DatabaseState()


def _connect():
    if not settings.database_url:
        raise RuntimeError('DATABASE_URL not set')
    kwargs = {
        'conninfo': settings.database_url,
        'connect_timeout': settings.database_connect_timeout,
    }
    if settings.database_ssl:
        kwargs['sslmode'] = 'require'
    return psycopg.connect(**kwargs)


def init_database() -> dict:
    if not settings.database_url:
        db_state.enabled = False
        db_state.last_error = None
        return {
            'enabled': False,
            'message': 'DATABASE_URL not set. Using in-memory fallback.',
        }

    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT 1')
                cur.fetchone()
        db_state.enabled = True
        db_state.last_error = None
        return {
            'enabled': True,
            'message': 'PostgreSQL connection established.',
        }
    except Exception as error:
        db_state.enabled = False
        db_state.last_error = str(error)
        return {
            'enabled': False,
            'message': 'PostgreSQL unavailable. Using in-memory fallback.',
        }


def database_status() -> dict:
    return {
        'enabled': db_state.enabled,
        'lastError': db_state.last_error,
    }


@contextmanager
def get_connection():
    if not db_state.enabled:
        raise RuntimeError('database_not_available')
    with _connect() as conn:
        yield conn


def query_all(sql: str, params: tuple = ()) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())


def query_one(sql: str, params: tuple = ()) -> dict | None:
    with get_connection() as conn:
        with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute(sql, params)
            return cur.fetchone()


def execute(sql: str, params: tuple = ()) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
        conn.commit()
