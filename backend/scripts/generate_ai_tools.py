#!/usr/bin/env python3
"""
Generate thousands of realistic AI tools for database seeding.
"""

import json
import random
from typing import Any

AI_TOOLS_CATEGORIES = {
    'Coding': ['code-assistant', 'debugging', 'testing', 'refactoring', 'documentation'],
    'Writing': ['copywriting', 'content-generation', 'editing', 'summarization', 'translation'],
    'Design': ['image-generation', 'design-assistant', 'animation', 'graphic-design', 'ui-design'],
    'Automation': ['workflow-automation', 'data-processing', 'scheduling', 'integration', 'rpa'],
    'Business': ['analytics', 'forecasting', 'market-research', 'hr-tools', 'finance'],
    'Research': ['paper-analysis', 'literature-review', 'data-analysis', 'hypothesis-testing', 'knowledge-base'],
    'Voice': ['speech-recognition', 'voice-synthesis', 'transcription', 'voice-cloning', 'audio-processing'],
    'Video': ['video-generation', 'video-editing', 'subtitle-generation', 'video-summarization', 'video-analysis'],
    'Marketing': ['campaigns', 'copywriting', 'analytics', 'lead-gen', 'seo'],
    'Sales': ['lead-scoring', 'pipeline', 'outreach', 'forecasting', 'crm-assist'],
    'Finance': ['budgeting', 'forecasting', 'risk-modeling', 'audit', 'reporting'],
    'Legal': ['contract-review', 'compliance', 'policy-drafting', 'research', 'summarization'],
    'Healthcare': ['clinical-notes', 'triage', 'diagnostics', 'imaging', 'patient-support'],
    'Education': ['tutoring', 'quiz-generation', 'lesson-plans', 'grading', 'feedback'],
    'HR': ['screening', 'onboarding', 'policy-assistant', 'engagement', 'performance'],
    'Recruiting': ['resume-screening', 'job-matching', 'interview-assistant', 'sourcing', 'outreach'],
    'Customer Support': ['ticket-triage', 'reply-generation', 'knowledge-search', 'qa', 'sentiment'],
    'Productivity': ['task-automation', 'note-taking', 'focus', 'workflow', 'assistant'],
    'Project Management': ['planning', 'risk-tracking', 'status', 'resource-allocation', 'roadmaps'],
    'Data Analytics': ['dashboards', 'sql-assistant', 'insights', 'forecasting', 'anomaly-detection'],
    'Business Intelligence': ['reporting', 'kpi-monitoring', 'insights', 'visualization', 'forecasting'],
    'SEO': ['keyword-research', 'content-optimization', 'rank-tracking', 'audits', 'competitor-analysis'],
    'Social Media': ['post-generation', 'scheduling', 'analytics', 'engagement', 'listening'],
    'E-commerce': ['catalog-optimization', 'pricing', 'recommendations', 'support', 'fraud-detection'],
    'Content Creation': ['idea-generation', 'script-writing', 'editing', 'repurposing', 'publishing'],
    'Email': ['drafting', 'personalization', 'follow-ups', 'classification', 'summarization'],
    'Chatbots': ['intent-detection', 'response-generation', 'handoff', 'knowledge-grounding', 'analytics'],
    'Knowledge Management': ['doc-search', 'knowledge-base', 'summaries', 'tagging', 'qna'],
    'Translation': ['text-translation', 'localization', 'tone-preservation', 'quality-check', 'glossary'],
    'Transcription': ['meeting-transcripts', 'speaker-diarization', 'highlights', 'search', 'exports'],
    'Speech Recognition': ['asr', 'speaker-id', 'command-recognition', 'keyword-spotting', 'streaming'],
    'Text to Speech': ['tts', 'voice-cloning', 'multilingual-voice', 'emotion-control', 'studio'],
    'Image Generation': ['text-to-image', 'style-transfer', 'upscaling', 'inpainting', 'variations'],
    'Image Editing': ['background-removal', 'retouching', 'inpainting', 'enhancement', 'batch-editing'],
    'Presentation': ['slide-generation', 'speaker-notes', 'design-assistant', 'summaries', 'templates'],
    'Spreadsheet': ['formula-assistant', 'data-cleaning', 'analysis', 'charting', 'automation'],
    'Document Processing': ['classification', 'entity-extraction', 'summaries', 'validation', 'routing'],
    'OCR': ['ocr-extraction', 'layout-detection', 'table-parsing', 'id-docs', 'forms'],
    'Cybersecurity': ['threat-detection', 'alert-triage', 'incident-response', 'phishing', 'risk-scoring'],
    'DevOps': ['ci-assistant', 'infra-automation', 'log-analysis', 'incident-management', 'cost-optimization'],
    'Testing': ['test-generation', 'coverage-analysis', 'regression', 'mocking', 'qa-assistant'],
    'Code Review': ['review-assistant', 'security-checks', 'style-enforcement', 'bug-detection', 'summaries'],
    'No-Code': ['workflow-builder', 'app-builder', 'integrations', 'automation', 'templates'],
    'Low-Code': ['app-scaffolding', 'connector-generation', 'workflow-logic', 'deployments', 'governance'],
    'CRM': ['contact-enrichment', 'lead-scoring', 'next-best-action', 'pipeline', 'forecasting'],
    'ERP': ['planning', 'inventory', 'forecasting', 'procurement', 'operations'],
    'Supply Chain': ['demand-planning', 'inventory-optimization', 'routing', 'risk-monitoring', 'procurement'],
    'Operations': ['process-mining', 'workflow-optimization', 'sla-monitoring', 'forecasting', 'automation'],
    'Real Estate': ['listing-analysis', 'valuation', 'lead-management', 'document-extraction', 'chat-assistant'],
    'Travel': ['itinerary', 'price-forecasting', 'support', 'recommendations', 'risk-alerts'],
    'Gaming': ['npc-dialog', 'asset-generation', 'analytics', 'anti-cheat', 'qa-testing'],
    'Music': ['composition', 'mixing', 'mastering', 'lyrics', 'recommendations'],
    'Podcasting': ['transcription', 'episode-planning', 'audio-enhancement', 'clips', 'show-notes'],
    'Meeting Assistants': ['note-taking', 'action-items', 'summaries', 'speaker-tracking', 'follow-ups'],
    'Scheduling': ['calendar-assistant', 'availability-matching', 'reminders', 'auto-booking', 'rescheduling'],
    'Personal Assistants': ['task-management', 'qna', 'context-memory', 'workflow', 'automation'],
    'Search': ['semantic-search', 'retrieval', 'ranking', 'summaries', 'query-expansion'],
    'News Intelligence': ['trend-detection', 'summarization', 'entity-tracking', 'alerts', 'sentiment'],
    'Compliance': ['policy-monitoring', 'controls-testing', 'reporting', 'evidence-collection', 'alerts'],
    'Procurement': ['vendor-analysis', 'rfp-assistant', 'contract-insights', 'spend-analysis', 'risk-monitoring'],
}


def _slugify(value: str) -> str:
    return value.strip().lower().replace(' ', '-')

COMPANIES = [
    'OpenAI', 'Anthropic', 'Google', 'Meta', 'Microsoft', 'Amazon', 'Apple',
    'Hugging Face', 'StabilityAI', 'Runway', 'Midjourney', '11labs', 'ElevenLabs',
    'Typeform', 'HubSpot', 'Zapier', 'Make', 'Integromat', 'Notion', 'Airtable',
    'Scale AI', 'Weights & Biases', 'Cohere', 'Together AI', 'Replicate',
    'Jasper', 'Copy.ai', 'Writersonic', 'Copyscape', 'Grammarly',
    'Canva', 'Adobe', 'Figma', 'FigsJam', 'Sketch',
    'Synthesia', 'D-ID', 'Hour One', 'Pictory', 'Flexclip',
    'Descript', 'Adobe Express', 'Kapwing', 'CapCut', 'InShot',
]

PRICING_MODELS = ['free', 'freemium', 'paid', 'enterprise']
PLATFORMS = [
    ['web'],
    ['web', 'mobile'],
    ['web', 'desktop'],
    ['web', 'api'],
    ['web', 'desktop', 'api'],
    ['web', 'desktop', 'mobile'],
    ['web', 'desktop', 'mobile', 'api'],
    ['api'],
    ['desktop'],
    ['mobile'],
]

FEATURES = [
    'collaboration', 'api-access', 'webhooks', 'custom-models', 'fine-tuning',
    'rate-limiting', 'batch-processing', 'real-time', 'offline-mode', 'mobile-app',
    'browser-extension', 'slack-integration', 'teams-integration', 'plugins',
    'templates', 'workflows', 'automation', 'scheduling', 'monitoring',
    'analytics', 'insights', 'reporting', 'export', 'import',
]


def generate_tool(idx: int) -> dict[str, Any]:
    """Generate a single AI tool."""
    category_name = random.choice(list(AI_TOOLS_CATEGORIES.keys()))
    subcategories = AI_TOOLS_CATEGORIES[category_name]
    
    base_names = [
        'Smart', 'Intelligent', 'AI', 'Auto', 'Instant', 'Rapid', 'Quantum',
        'Neural', 'Cognitive', 'Synthetic', 'Adaptive', 'Predictive', 'Generative'
    ]
    
    features_list = random.choice(subcategories)
    company = random.choice(COMPANIES)
    
    name = f"{random.choice(base_names)} {features_list.replace('-', ' ').title()}"
    slug = f"{category_name.lower()}-{random.choice(subcategories).lower()}-{idx}"
    
    description = f"Advanced AI tool for {features_list.replace('-', ' ')} with cutting-edge {category_name.lower()} capabilities."
    
    website = f"https://example-{idx}.ai/"
    pricing = random.choice(PRICING_MODELS)
    platforms = random.choice(PLATFORMS)
    
    performance = random.randint(75, 99)
    popularity = random.randint(70, 99)
    value = random.randint(75, 98)
    innovation = random.randint(75, 99)
    
    api_avail = random.choice([True, True, True, False])
    open_src = random.choice([True, False, False])
    
    tool_features = random.sample(FEATURES, k=random.randint(3, 8))
    
    return {
        'name': name,
        'slug': slug,
        'description_short': description,
        'description_full': f"{description} Includes features: {', '.join(tool_features[:3])}. Perfect for professionals and teams.",
        'website_url': website,
        'pricing_model': pricing,
        'platforms': platforms,
        'performance_score': performance,
        'popularity_score': popularity,
        'value_score': value,
        'innovation_score': innovation,
        'api_available': api_avail,
        'open_source': open_src,
        'company': company,
        'category': category_name,
        'features': tool_features,
        'trending': random.choice([True, True, False]),
        'metadata': {
            'source': 'generated',
            'features_count': len(tool_features),
            'last_updated': '2026-03-21',
        }
    }


def generate_tools_sql(count: int = 2500) -> str:
    """Generate SQL INSERT statements for AI tools."""
    tools = [generate_tool(i) for i in range(count)]
    
    # Group by category
    tools_by_category = {}
    for tool in tools:
        cat = tool['category']
        if cat not in tools_by_category:
            tools_by_category[cat] = []
        tools_by_category[cat].append(tool)
    
    # Build INSERT statements
    sql_parts = []
    
    # Insert categories
    categories = list(AI_TOOLS_CATEGORIES.keys())
    cat_insert = "INSERT INTO categories (name, slug, description, sort_order) VALUES\n"
    cat_values = []
    for i, cat in enumerate(categories, 1):
        cat_values.append(f"  ('{cat}', '{_slugify(cat)}', 'AI tools for {cat.lower()}', {i})")
    cat_insert += ",\n".join(cat_values) + "\nON CONFLICT (slug) DO NOTHING;\n"
    sql_parts.append(cat_insert)
    
    # Insert tools in batches
    batch_size = 50
    for batch_idx in range(0, len(tools), batch_size):
        batch = tools[batch_idx:batch_idx + batch_size]
        insert_sql = "INSERT INTO tools (\n  name, slug, description_short, description_full, website_url,\n  pricing_model, platforms, performance_score, popularity_score, value_score,\n  innovation_score, api_available, open_source, company, metadata\n) VALUES\n"
        
        values = []
        for tool in batch:
            platforms_arr = "ARRAY[" + ", ".join(f"'{p}'" for p in tool['platforms']) + "]"
            metadata_json = json.dumps(tool['metadata']).replace("'", "''")
            
            value_str = f"""  (
    '{tool['name'].replace("'", "''")}',
    '{tool['slug']}',
    '{tool['description_short'].replace("'", "''")}',
    '{tool['description_full'].replace("'", "''")}',
    '{tool['website_url']}',
    '{tool['pricing_model']}',
    {platforms_arr},
    {tool['performance_score']},
    {tool['popularity_score']},
    {tool['value_score']},
    {tool['innovation_score']},
    {str(tool['api_available']).lower()},
    {str(tool['open_source']).lower()},
    '{tool['company']}',
    '{metadata_json}'::jsonb
  )"""
            values.append(value_str)
        
        insert_sql += ",\n".join(values) + "\nON CONFLICT (slug) DO NOTHING;\n"
        sql_parts.append(insert_sql)
    
    # Wire up categories to tools
    for category_name, category_tools in tools_by_category.items():
        cat_assignment = f"""INSERT INTO tool_categories (tool_id, category_id, is_primary)
SELECT t.id, c.id, TRUE
FROM tools t
JOIN categories c ON c.slug = '{_slugify(category_name)}'
WHERE t.slug IN ({','.join(f"'{tool['slug']}'" for tool in category_tools)})
ON CONFLICT (tool_id, category_id) DO NOTHING;
"""
        sql_parts.append(cat_assignment)
    
    return "\n".join(sql_parts)


if __name__ == '__main__':
    tools_count = 2500
    print(f"Generating {tools_count} AI tools...")
    sql = generate_tools_sql(tools_count)
    
    output_path = 'backend/db/seed_ai_tools.postgres.psql'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"✓ Generated {tools_count} tools in {output_path}")
