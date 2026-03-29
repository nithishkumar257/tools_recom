#!/usr/bin/env python
from backend.app.catalog_service import list_tools, FALLBACK_TOOLS
from backend.app.db import db_state

print(f"Database enabled: {db_state.enabled}")
print(f"FALLBACK_TOOLS length: {len(FALLBACK_TOOLS)}")

result = list_tools({'page': 1, 'limit': 100, 'category': 'All'})
print(f"\nAPI Result Total: {result['pagination']['total']}")
print(f"API Result Items: {len(result['items'])}")
print("\nFirst 10 items returned:")
for i, item in enumerate(result['items'][:10]):
    print(f"  {i+1}. {item['name']} ({item['category']})")

# Check if they're in FALLBACK_TOOLS
print("\nChecking if returned tools are in FALLBACK_TOOLS:")
fallback_ids = {t['id'] for t in FALLBACK_TOOLS}
for item in result['items'][:4]:
    in_fallback = item['id'] in fallback_ids
    print(f"  {item['id']}: {in_fallback}")
