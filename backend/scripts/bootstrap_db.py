from __future__ import annotations

from pathlib import Path
import sys

from dotenv import load_dotenv
import psycopg


ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env')


def main() -> int:
    import os
    connection_string = os.getenv('DATABASE_URL')
    ssl_enabled = os.getenv('DATABASE_SSL', 'false').lower() == 'true'
    connect_timeout = int(os.getenv('DATABASE_CONNECT_TIMEOUT', '5'))

    if not connection_string:
        print('DATABASE_URL is required to run DB bootstrap.')
        return 1

    schema_sql = (ROOT / 'db' / 'schema.postgres.psql').read_text(encoding='utf-8')
    seed_sql = (ROOT / 'db' / 'seed.postgres.psql').read_text(encoding='utf-8')
    
    # Load generated AI tools if available
    seed_ai_tools_path = ROOT / 'db' / 'seed_ai_tools.postgres.psql'
    seed_ai_tools_sql = seed_ai_tools_path.read_text(encoding='utf-8') if seed_ai_tools_path.exists() else ''

    kwargs = {'conninfo': connection_string, 'connect_timeout': connect_timeout}
    if ssl_enabled:
        kwargs['sslmode'] = 'require'

    try:
        with psycopg.connect(**kwargs) as conn:
            with conn.cursor() as cur:
                print('Applying schema...')
                cur.execute(schema_sql)
                print('Applying base seed...')
                cur.execute(seed_sql)
                if seed_ai_tools_sql:
                    print('Applying generated AI tools seed...')
                    cur.execute(seed_ai_tools_sql)
            conn.commit()
        print(f'Database bootstrap completed successfully.')
        if seed_ai_tools_sql:
            print(f'✓ Loaded seed data with AI tools dataset')
        return 0
    except Exception as error:
        print(f'Database bootstrap failed: {error}')
        return 1


if __name__ == '__main__':
    sys.exit(main())
