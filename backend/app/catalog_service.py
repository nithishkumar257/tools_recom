from __future__ import annotations

from datetime import datetime
import re
from uuid import uuid4
from typing import Any

from .cache_service import get_cached, invalidate_cache, make_cache_key, set_cached
from .db import db_state, get_connection, query_all, query_one


FALLBACK_TOOLS = [
    {
        'id': 'github-copilot',
        'name': 'GitHub Copilot',
        'category': 'Coding',
        'description': 'AI pair programmer for code suggestions and chat',
        'url': 'https://github.com/features/copilot',
        'pricing': 'Free + Paid',
        'score': 97,
        'developer': 'Microsoft/GitHub',
        'trending': True,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 92, 'speed': 95, 'ease': 97, 'value': 94},
    },
    {
        'id': 'codeium',
        'name': 'Codeium',
        'category': 'Coding',
        'description': 'Free AI coding assistant with broad language support',
        'url': 'https://codeium.com',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Exafunction',
        'trending': False,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'tabnine',
        'name': 'Tabnine',
        'category': 'Coding',
        'description': 'AI code completion powered by deep learning',
        'url': 'https://www.tabnine.com',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'Tabnine',
        'trending': False,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'claude',
        'name': 'Claude',
        'category': 'Coding',
        'description': 'Advanced AI assistant for coding and analysis',
        'url': 'https://claude.ai',
        'pricing': 'Free + Paid',
        'score': 96,
        'developer': 'Anthropic',
        'trending': False,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 91, 'speed': 94, 'ease': 96, 'value': 93},
    },
    {
        'id': 'codex',
        'name': 'Codex',
        'category': 'Coding',
        'description': 'OpenAI\'s code generation model',
        'url': 'https://openai.com/codex',
        'pricing': 'Free + Paid',
        'score': 89,
        'developer': 'OpenAI',
        'trending': False,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 84, 'speed': 87, 'ease': 89, 'value': 86},
    },
    {
        'id': 'replit-ghostwriter',
        'name': 'Replit Ghostwriter',
        'category': 'Coding',
        'description': 'AI coding assistant in Replit IDE',
        'url': 'https://replit.com',
        'pricing': 'Free + Paid',
        'score': 82,
        'developer': 'Replit',
        'trending': True,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 77, 'speed': 80, 'ease': 82, 'value': 79},
    },
    {
        'id': 'amazon-codewhisperer',
        'name': 'Amazon CodeWhisperer',
        'category': 'Coding',
        'description': 'ML-powered code suggestions by AWS',
        'url': 'https://aws.amazon.com/codewhisperer',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Amazon',
        'trending': False,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'perplexity-ai',
        'name': 'Perplexity AI',
        'category': 'Coding',
        'description': 'AI assistant for research and coding',
        'url': 'https://perplexity.ai',
        'pricing': 'Free + Paid',
        'score': 88,
        'developer': 'Perplexity',
        'trending': True,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 83, 'speed': 86, 'ease': 88, 'value': 85},
    },
    {
        'id': 'chatgpt',
        'name': 'ChatGPT',
        'category': 'Writing',
        'description': 'Advanced general-purpose AI assistant',
        'url': 'https://chatgpt.com',
        'pricing': 'Free + Paid',
        'score': 98,
        'developer': 'OpenAI',
        'trending': False,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 93, 'speed': 96, 'ease': 98, 'value': 95},
    },
    {
        'id': 'jasper',
        'name': 'Jasper',
        'category': 'Writing',
        'description': 'AI content writer for marketers',
        'url': 'https://www.jasper.ai',
        'pricing': 'Free + Paid',
        'score': 87,
        'developer': 'Jasper',
        'trending': True,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 82, 'speed': 85, 'ease': 87, 'value': 84},
    },
    {
        'id': 'copy-ai',
        'name': 'Copy.ai',
        'category': 'Writing',
        'description': 'AI copywriting tool for marketing',
        'url': 'https://www.copy.ai',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'Copy.ai',
        'trending': False,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'writersonic',
        'name': 'Writersonic',
        'category': 'Writing',
        'description': 'AI writer for content creation',
        'url': 'https://writersonic.com',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Writersonic',
        'trending': True,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'grammarly',
        'name': 'Grammarly',
        'category': 'Writing',
        'description': 'AI-powered writing assistant',
        'url': 'https://www.grammarly.com',
        'pricing': 'Free + Paid',
        'score': 92,
        'developer': 'Grammarly',
        'trending': False,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 87, 'speed': 90, 'ease': 92, 'value': 89},
    },
    {
        'id': 'hemingway-editor',
        'name': 'Hemingway Editor',
        'category': 'Writing',
        'description': 'App to improve writing clarity',
        'url': 'https://www.hemingwayapp.com',
        'pricing': 'Free + Paid',
        'score': 80,
        'developer': 'Hemingway',
        'trending': False,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 75, 'speed': 78, 'ease': 80, 'value': 77},
    },
    {
        'id': 'quillbot',
        'name': 'Quillbot',
        'category': 'Writing',
        'description': 'AI paraphrasing and writing tool',
        'url': 'https://quillbot.com',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'QuillBot',
        'trending': True,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'prowritingaid',
        'name': 'ProWritingAid',
        'category': 'Writing',
        'description': 'Writing analysis and improvement tool',
        'url': 'https://www.prowritingaid.com',
        'pricing': 'Free + Paid',
        'score': 88,
        'developer': 'ProWritingAid',
        'trending': True,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 83, 'speed': 86, 'ease': 88, 'value': 85},
    },
    {
        'id': 'sudowrite',
        'name': 'Sudowrite',
        'category': 'Writing',
        'description': 'AI writing assistant for creative writers',
        'url': 'https://www.sudowrite.com',
        'pricing': 'Free + Paid',
        'score': 86,
        'developer': 'Sudowrite',
        'trending': True,
        'tags': ['ai', 'writing', 'writing', 'content', 'marketing'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 81, 'speed': 84, 'ease': 86, 'value': 83},
    },
    {
        'id': 'midjourney',
        'name': 'Midjourney',
        'category': 'Design',
        'description': 'AI image generator for creative prompts',
        'url': 'https://www.midjourney.com',
        'pricing': 'Free + Paid',
        'score': 94,
        'developer': 'Midjourney',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 89, 'speed': 92, 'ease': 94, 'value': 91},
    },
    {
        'id': 'dall-e',
        'name': 'DALL-E',
        'category': 'Design',
        'description': 'OpenAI\'s AI image generation model',
        'url': 'https://openai.com/dall-e-3',
        'pricing': 'Free + Paid',
        'score': 93,
        'developer': 'OpenAI',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 88, 'speed': 91, 'ease': 93, 'value': 90},
    },
    {
        'id': 'stable-diffusion',
        'name': 'Stable Diffusion',
        'category': 'Design',
        'description': 'Open-source AI image generation',
        'url': 'https://stability.ai',
        'pricing': 'Free + Paid',
        'score': 91,
        'developer': 'Stability AI',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 86, 'speed': 89, 'ease': 91, 'value': 88},
    },
    {
        'id': 'adobe-firefly',
        'name': 'Adobe Firefly',
        'category': 'Design',
        'description': 'AI generative features in Adobe products',
        'url': 'https://www.adobe.com/firefly',
        'pricing': 'Free + Paid',
        'score': 89,
        'developer': 'Adobe',
        'trending': False,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 84, 'speed': 87, 'ease': 89, 'value': 86},
    },
    {
        'id': 'canva-ai',
        'name': 'Canva AI',
        'category': 'Design',
        'description': 'AI-powered design suggestions in Canva',
        'url': 'https://www.canva.com',
        'pricing': 'Free + Paid',
        'score': 86,
        'developer': 'Canva',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 81, 'speed': 84, 'ease': 86, 'value': 83},
    },
    {
        'id': 'figma-ai',
        'name': 'Figma AI',
        'category': 'Design',
        'description': 'AI design tools in Figma',
        'url': 'https://www.figma.com',
        'pricing': 'Free + Paid',
        'score': 87,
        'developer': 'Figma',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 82, 'speed': 85, 'ease': 87, 'value': 84},
    },
    {
        'id': 'runway',
        'name': 'Runway',
        'category': 'Design',
        'description': 'AI video and image generation platform',
        'url': 'https://www.runway.com',
        'pricing': 'Free + Paid',
        'score': 88,
        'developer': 'Runway ML',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 83, 'speed': 86, 'ease': 88, 'value': 85},
    },
    {
        'id': 'synthesia',
        'name': 'Synthesia',
        'category': 'Design',
        'description': 'AI video generation from text',
        'url': 'https://www.synthesia.io',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Synthesia',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'd-id',
        'name': 'D-ID',
        'category': 'Design',
        'description': 'AI video generation with digital avatars',
        'url': 'https://www.d-id.com',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'D-ID',
        'trending': False,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'zapier',
        'name': 'Zapier',
        'category': 'Automation',
        'description': 'Workflow automation and integrations',
        'url': 'https://zapier.com',
        'pricing': 'Free + Paid',
        'score': 90,
        'developer': 'Zapier',
        'trending': True,
        'tags': ['ai', 'automation', 'automation', 'workflow', 'integration'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 85, 'speed': 88, 'ease': 90, 'value': 87},
    },
    {
        'id': 'n8n',
        'name': 'n8n',
        'category': 'Automation',
        'description': 'Open-source workflow automation platform',
        'url': 'https://n8n.io',
        'pricing': 'Free + Paid',
        'score': 88,
        'developer': 'n8n',
        'trending': True,
        'tags': ['ai', 'automation', 'automation', 'workflow', 'integration'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 83, 'speed': 86, 'ease': 88, 'value': 85},
    },
    {
        'id': 'make',
        'name': 'Make (Integromat)',
        'category': 'Automation',
        'description': 'Cloud automation and workflow platform',
        'url': 'https://www.make.com',
        'pricing': 'Free + Paid',
        'score': 87,
        'developer': 'Make',
        'trending': True,
        'tags': ['ai', 'automation', 'automation', 'workflow', 'integration'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 82, 'speed': 85, 'ease': 87, 'value': 84},
    },
    {
        'id': 'ifttt',
        'name': 'IFTTT',
        'category': 'Automation',
        'description': 'If This Then That automation service',
        'url': 'https://ifttt.com',
        'pricing': 'Free + Paid',
        'score': 82,
        'developer': 'IFTTT',
        'trending': True,
        'tags': ['ai', 'automation', 'automation', 'workflow', 'integration'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 77, 'speed': 80, 'ease': 82, 'value': 79},
    },
    {
        'id': 'automation-anywhere',
        'name': 'Automation Anywhere',
        'category': 'Automation',
        'description': 'Enterprise RPA platform',
        'url': 'https://www.automationanywhere.com',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Automation Anywhere',
        'trending': False,
        'tags': ['ai', 'automation', 'automation', 'workflow', 'integration'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'uipath',
        'name': 'UiPath',
        'category': 'Automation',
        'description': 'Enterprise robotic process automation',
        'url': 'https://www.uipath.com',
        'pricing': 'Free + Paid',
        'score': 86,
        'developer': 'UiPath',
        'trending': False,
        'tags': ['ai', 'automation', 'automation', 'workflow', 'integration'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 81, 'speed': 84, 'ease': 86, 'value': 83},
    },
    {
        'id': 'assistant',
        'name': 'Assistant',
        'category': 'Automation',
        'description': 'AI automation assistant for repetitive tasks',
        'url': 'https://example.com',
        'pricing': 'Free + Paid',
        'score': 80,
        'developer': 'Various',
        'trending': True,
        'tags': ['ai', 'automation', 'automation', 'workflow', 'integration'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 75, 'speed': 78, 'ease': 80, 'value': 77},
    },
    {
        'id': 'power-bi',
        'name': 'Power BI',
        'category': 'Business',
        'description': 'Business analytics and data visualization',
        'url': 'https://powerbi.microsoft.com',
        'pricing': 'Free + Paid',
        'score': 89,
        'developer': 'Microsoft',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 84, 'speed': 87, 'ease': 89, 'value': 86},
    },
    {
        'id': 'tableau',
        'name': 'Tableau',
        'category': 'Business',
        'description': 'Data visualization and analytics platform',
        'url': 'https://www.tableau.com',
        'pricing': 'Free + Paid',
        'score': 90,
        'developer': 'Salesforce',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 85, 'speed': 88, 'ease': 90, 'value': 87},
    },
    {
        'id': 'looker',
        'name': 'Looker',
        'category': 'Business',
        'description': 'Business intelligence and analytics',
        'url': 'https://www.looker.com',
        'pricing': 'Free + Paid',
        'score': 88,
        'developer': 'Google',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 83, 'speed': 86, 'ease': 88, 'value': 85},
    },
    {
        'id': 'alteryx',
        'name': 'Alteryx',
        'category': 'Business',
        'description': 'Data analytics and automation platform',
        'url': 'https://www.alteryx.com',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Alteryx',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'qlik',
        'name': 'Qlik',
        'category': 'Business',
        'description': 'Data analytics and visualization platform',
        'url': 'https://www.qlik.com',
        'pricing': 'Free + Paid',
        'score': 86,
        'developer': 'Qlik',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 81, 'speed': 84, 'ease': 86, 'value': 83},
    },
    {
        'id': 'scale-ai',
        'name': 'Scale AI',
        'category': 'Business',
        'description': 'Data labeling and quality for AI',
        'url': 'https://www.scale.com',
        'pricing': 'Free + Paid',
        'score': 87,
        'developer': 'Scale AI',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 82, 'speed': 85, 'ease': 87, 'value': 84},
    },
    {
        'id': 'consensus',
        'name': 'Consensus',
        'category': 'Research',
        'description': 'AI research paper search engine',
        'url': 'https://consensus.app',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'Consensus',
        'trending': True,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'semantic-scholar',
        'name': 'Semantic Scholar',
        'category': 'Research',
        'description': 'AI-powered academic paper search',
        'url': 'https://www.semanticscholar.org',
        'pricing': 'Free + Paid',
        'score': 86,
        'developer': 'Allen AI',
        'trending': False,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 81, 'speed': 84, 'ease': 86, 'value': 83},
    },
    {
        'id': 'scholarcy',
        'name': 'Scholarcy',
        'category': 'Research',
        'description': 'AI summarization of research papers',
        'url': 'https://www.scholarcy.com',
        'pricing': 'Free + Paid',
        'score': 82,
        'developer': 'Scholarcy',
        'trending': True,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 77, 'speed': 80, 'ease': 82, 'value': 79},
    },
    {
        'id': 'paperswithcode',
        'name': 'PapersWithCode',
        'category': 'Research',
        'description': 'ML research papers with code',
        'url': 'https://www.paperswithcode.com',
        'pricing': 'Free + Paid',
        'score': 88,
        'developer': 'Meta',
        'trending': False,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 83, 'speed': 86, 'ease': 88, 'value': 85},
    },
    {
        'id': 'dimensions',
        'name': 'Dimensions',
        'category': 'Research',
        'description': 'Research analytics and discovery platform',
        'url': 'https://www.dimensions.ai',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Dimensions',
        'trending': True,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'elevenlabs',
        'name': 'ElevenLabs',
        'category': 'Voice',
        'description': 'AI voice generation and synthesis',
        'url': 'https://elevenlabs.io',
        'pricing': 'Free + Paid',
        'score': 91,
        'developer': 'ElevenLabs',
        'trending': True,
        'tags': ['ai', 'voice', 'voice', 'audio', 'speech', 'transcription'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 86, 'speed': 89, 'ease': 91, 'value': 88},
    },
    {
        'id': 'descript',
        'name': 'Descript',
        'category': 'Voice',
        'description': 'Video and audio editing with AI',
        'url': 'https://www.descript.com',
        'pricing': 'Free + Paid',
        'score': 88,
        'developer': 'Descript',
        'trending': False,
        'tags': ['ai', 'voice', 'voice', 'audio', 'speech', 'transcription'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 83, 'speed': 86, 'ease': 88, 'value': 85},
    },
    {
        'id': 'otter-ai',
        'name': 'Otter.ai',
        'category': 'Voice',
        'description': 'AI transcription and meeting notes',
        'url': 'https://otter.ai',
        'pricing': 'Free + Paid',
        'score': 86,
        'developer': 'Otter',
        'trending': False,
        'tags': ['ai', 'voice', 'voice', 'audio', 'speech', 'transcription'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 81, 'speed': 84, 'ease': 86, 'value': 83},
    },
    {
        'id': 'fireflies-ai',
        'name': 'Fireflies.ai',
        'category': 'Voice',
        'description': 'AI meeting recording and transcription',
        'url': 'https://fireflies.ai',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'Fireflies',
        'trending': True,
        'tags': ['ai', 'voice', 'voice', 'audio', 'speech', 'transcription'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'rev',
        'name': 'Rev',
        'category': 'Voice',
        'description': 'Professional transcription services',
        'url': 'https://www.rev.com',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Rev',
        'trending': True,
        'tags': ['ai', 'voice', 'voice', 'audio', 'speech', 'transcription'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'murf-ai',
        'name': 'Murf AI',
        'category': 'Voice',
        'description': 'Text-to-speech with AI voices',
        'url': 'https://murf.ai',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Murf',
        'trending': False,
        'tags': ['ai', 'voice', 'voice', 'audio', 'speech', 'transcription'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'google-cloud-speech',
        'name': 'Google Cloud Speech',
        'category': 'Voice',
        'description': 'Google\'s speech recognition API',
        'url': 'https://cloud.google.com/speech-to-text',
        'pricing': 'Free + Paid',
        'score': 89,
        'developer': 'Google',
        'trending': True,
        'tags': ['ai', 'voice', 'voice', 'audio', 'speech', 'transcription'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 84, 'speed': 87, 'ease': 89, 'value': 86},
    },
    {
        'id': 'fliki',
        'name': 'Fliki',
        'category': 'Design',
        'description': 'AI video creation from text and images',
        'url': 'https://fliki.ai',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Fliki',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'pictory',
        'name': 'Pictory',
        'category': 'Design',
        'description': 'AI video generation from scripts',
        'url': 'https://www.pictory.ai',
        'pricing': 'Free + Paid',
        'score': 82,
        'developer': 'Pictory',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 77, 'speed': 80, 'ease': 82, 'value': 79},
    },
    {
        'id': 'heygen',
        'name': 'HeyGen',
        'category': 'Design',
        'description': 'AI video generator with avatars',
        'url': 'https://www.heygen.com',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'HeyGen',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'opusclip',
        'name': 'OpusClip',
        'category': 'Design',
        'description': 'AI short-form video creation',
        'url': 'https://opusclip.com',
        'pricing': 'Free + Paid',
        'score': 81,
        'developer': 'OpusClip',
        'trending': False,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 76, 'speed': 79, 'ease': 81, 'value': 78},
    },
    {
        'id': 'runway-gen2',
        'name': 'Runway Gen-2',
        'category': 'Design',
        'description': 'AI video generation model',
        'url': 'https://www.runway.com',
        'pricing': 'Free + Paid',
        'score': 87,
        'developer': 'Runway',
        'trending': True,
        'tags': ['ai', 'design', 'design', 'image', 'creative', 'generation'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 82, 'speed': 85, 'ease': 87, 'value': 84},
    },
    {
        'id': 'intercom',
        'name': 'Intercom',
        'category': 'Business',
        'description': 'Customer communication platform with AI',
        'url': 'https://www.intercom.com',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Intercom',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'drift',
        'name': 'Drift',
        'category': 'Business',
        'description': 'Conversational marketing platform',
        'url': 'https://www.drift.com',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Drift',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'zendesk',
        'name': 'Zendesk',
        'category': 'Business',
        'description': 'Customer service platform with AI',
        'url': 'https://www.zendesk.com',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'Zendesk',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'freshdesk',
        'name': 'Freshdesk',
        'category': 'Business',
        'description': 'Cloud-based support ticket system',
        'url': 'https://freshdesk.com',
        'pricing': 'Free + Paid',
        'score': 82,
        'developer': 'Freshworks',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 77, 'speed': 80, 'ease': 82, 'value': 79},
    },
    {
        'id': 'helpscout',
        'name': 'Helpscout',
        'category': 'Business',
        'description': 'Help desk software with AI',
        'url': 'https://www.helpscout.com',
        'pricing': 'Free + Paid',
        'score': 81,
        'developer': 'Help Scout',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 76, 'speed': 79, 'ease': 81, 'value': 78},
    },
    {
        'id': 'buffer',
        'name': 'Buffer',
        'category': 'Business',
        'description': 'Social media scheduling with AI insights',
        'url': 'https://buffer.com',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Buffer',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'hootsuite',
        'name': 'Hootsuite',
        'category': 'Business',
        'description': 'Social media management platform',
        'url': 'https://hootsuite.com',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'Hootsuite',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'sprout-social',
        'name': 'Sprout Social',
        'category': 'Business',
        'description': 'Social media management and analytics',
        'url': 'https://sproutsocial.com',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Sprout Social',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'later',
        'name': 'Later',
        'category': 'Business',
        'description': 'Instagram marketing and scheduling',
        'url': 'https://www.later.com',
        'pricing': 'Free + Paid',
        'score': 82,
        'developer': 'Later',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 77, 'speed': 80, 'ease': 82, 'value': 79},
    },
    {
        'id': 'semrush',
        'name': 'Semrush',
        'category': 'Business',
        'description': 'SEO and content marketing platform',
        'url': 'https://semrush.com',
        'pricing': 'Free + Paid',
        'score': 86,
        'developer': 'Semrush',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 81, 'speed': 84, 'ease': 86, 'value': 83},
    },
    {
        'id': 'notion-ai',
        'name': 'Notion AI',
        'category': 'Business',
        'description': 'AI features in Notion workspace',
        'url': 'https://www.notion.so',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'Notion',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'obsidian-copilot',
        'name': 'Obsidian Copilot',
        'category': 'Business',
        'description': 'AI assistant for Obsidian notes',
        'url': 'https://obsidian.md',
        'pricing': 'Free + Paid',
        'score': 81,
        'developer': 'Obsidian',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 76, 'speed': 79, 'ease': 81, 'value': 78},
    },
    {
        'id': 'roam-research',
        'name': 'Roam Research',
        'category': 'Business',
        'description': 'Connected notes system with AI',
        'url': 'https://roamresearch.com',
        'pricing': 'Free + Paid',
        'score': 80,
        'developer': 'Roam',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 75, 'speed': 78, 'ease': 80, 'value': 77},
    },
    {
        'id': 'ms-copilot-365',
        'name': 'Microsoft Copilot in Microsoft 365',
        'category': 'Business',
        'description': 'AI assistant integrated in MS Office',
        'url': 'https://www.microsoft.com',
        'pricing': 'Free + Paid',
        'score': 88,
        'developer': 'Microsoft',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 83, 'speed': 86, 'ease': 88, 'value': 85},
    },
    {
        'id': 'google-workspace-ai',
        'name': 'Google Workspace AI',
        'category': 'Business',
        'description': 'AI features in Google Workspace',
        'url': 'https://workspace.google.com',
        'pricing': 'Free + Paid',
        'score': 86,
        'developer': 'Google',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 81, 'speed': 84, 'ease': 86, 'value': 83},
    },
    {
        'id': 'relatable',
        'name': 'Relatable',
        'category': 'Business',
        'description': 'AI product recommendation engine',
        'url': 'https://relatable.ai',
        'pricing': 'Free + Paid',
        'score': 79,
        'developer': 'Relatable',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 74, 'speed': 77, 'ease': 79, 'value': 76},
    },
    {
        'id': 'algopix',
        'name': 'Algopix',
        'category': 'Business',
        'description': 'Amazon seller analytics with AI',
        'url': 'https://www.algopix.com',
        'pricing': 'Free + Paid',
        'score': 81,
        'developer': 'Algopix',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 76, 'speed': 79, 'ease': 81, 'value': 78},
    },
    {
        'id': 'keepa',
        'name': 'Keepa',
        'category': 'Business',
        'description': 'Amazon price tracking and analytics',
        'url': 'https://keepa.com',
        'pricing': 'Free + Paid',
        'score': 82,
        'developer': 'Keepa',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 77, 'speed': 80, 'ease': 82, 'value': 79},
    },
    {
        'id': 'khan-academy',
        'name': 'Khan Academy',
        'category': 'Research',
        'description': 'Learning platform with AI personalization',
        'url': 'https://www.khanacademy.org',
        'pricing': 'Free + Paid',
        'score': 85,
        'developer': 'Khan Academy',
        'trending': False,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 80, 'speed': 83, 'ease': 85, 'value': 82},
    },
    {
        'id': 'duolingo-max',
        'name': 'Duolingo Max',
        'category': 'Research',
        'description': 'Language learning with AI',
        'url': 'https://www.duolingo.com',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Duolingo',
        'trending': False,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'squirrel-ai',
        'name': 'Squirrel AI',
        'category': 'Research',
        'description': 'Adaptive learning platform',
        'url': 'https://www.squirrelai.com',
        'pricing': 'Free + Paid',
        'score': 82,
        'developer': 'Squirrel AI',
        'trending': True,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 77, 'speed': 80, 'ease': 82, 'value': 79},
    },
    {
        'id': 'coursera',
        'name': 'Coursera',
        'category': 'Research',
        'description': 'Online learning platform with AI',
        'url': 'https://www.coursera.org',
        'pricing': 'Free + Paid',
        'score': 84,
        'developer': 'Coursera',
        'trending': True,
        'tags': ['ai', 'research', 'research', 'learning', 'education'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 79, 'speed': 82, 'ease': 84, 'value': 81},
    },
    {
        'id': 'hireability',
        'name': 'HireAbility',
        'category': 'Business',
        'description': 'AI recruitment and hiring platform',
        'url': 'https://www.hireability.ai',
        'pricing': 'Free + Paid',
        'score': 80,
        'developer': 'HireAbility',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 75, 'speed': 78, 'ease': 80, 'value': 77},
    },
    {
        'id': 'workable',
        'name': 'Workable',
        'category': 'Business',
        'description': 'Recruitment software with AI',
        'url': 'https://www.workable.com',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Workable',
        'trending': False,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'interviewer',
        'name': 'Interviewer',
        'category': 'Business',
        'description': 'AI video interviewing platform',
        'url': 'https://www.interviewer.ai',
        'pricing': 'Free + Paid',
        'score': 79,
        'developer': 'Interviewer',
        'trending': True,
        'tags': ['ai', 'business', 'business', 'analytics', 'productivity'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 74, 'speed': 77, 'ease': 79, 'value': 76},
    },
    {
        'id': 'github-copilot-x',
        'name': 'GitHub Copilot X',
        'category': 'Coding',
        'description': 'Advanced version of GitHub Copilot',
        'url': 'https://github.com/features/copilot',
        'pricing': 'Free + Paid',
        'score': 96,
        'developer': 'GitHub',
        'trending': False,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 91, 'speed': 94, 'ease': 96, 'value': 93},
    },
    {
        'id': 'enzyme',
        'name': 'Enzyme',
        'category': 'Coding',
        'description': 'AI code review and quality tool',
        'url': 'https://getenzyme.com',
        'pricing': 'Free + Paid',
        'score': 83,
        'developer': 'Enzyme',
        'trending': True,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 78, 'speed': 81, 'ease': 83, 'value': 80},
    },
    {
        'id': 'kolkoda',
        'name': 'Kolkoda',
        'category': 'Coding',
        'description': 'AI-powered code sharing platform',
        'url': 'https://kolkoda.ai',
        'pricing': 'Free + Paid',
        'score': 78,
        'developer': 'Kolkoda',
        'trending': True,
        'tags': ['ai', 'coding', 'code', 'development', 'programming'],
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {'accuracy': 73, 'speed': 76, 'ease': 78, 'value': 75},
    },
]

FALLBACK_BOOKMARKS: dict[str, set[str]] = {}
FALLBACK_COLLECTIONS: dict[str, list[dict[str, Any]]] = {}
FALLBACK_REVIEWS: dict[str, list[dict[str, Any]]] = {}

EXTENDED_CATEGORY_TAXONOMY: list[str] = [
    'Automation', 'Business', 'Coding', 'Design', 'Research', 'Voice', 'Writing',
    'Video', 'Marketing', 'Sales', 'Finance', 'Legal', 'Healthcare', 'Education',
    'HR', 'Recruiting', 'Customer Support', 'Productivity', 'Project Management',
    'Data Analytics', 'Business Intelligence', 'SEO', 'Social Media', 'E-commerce',
    'Content Creation', 'Email', 'Chatbots', 'Knowledge Management', 'Translation',
    'Transcription', 'Speech Recognition', 'Text to Speech', 'Image Generation',
    'Image Editing', 'Presentation', 'Spreadsheet', 'Document Processing',
    'OCR', 'Cybersecurity', 'DevOps', 'Testing', 'Code Review', 'No-Code',
    'Low-Code', 'CRM', 'ERP', 'Supply Chain', 'Operations', 'Real Estate',
    'Travel', 'Gaming', 'Music', 'Podcasting', 'Meeting Assistants', 'Scheduling',
    'Personal Assistants', 'Search', 'News Intelligence', 'Compliance', 'Procurement',
]


def _slugify(value: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', (value or '').strip().lower())
    slug = re.sub(r'-{2,}', '-', slug).strip('-')
    return slug or 'tool'


def _coerce_pricing_model(value: str) -> str:
    normalized = (value or 'free').strip().lower()
    return normalized if normalized in {'free', 'freemium', 'paid', 'enterprise'} else 'free'


def _normalize_submission(payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get('name', '')).strip()
    website_url = str(payload.get('website_url') or payload.get('url') or '').strip()
    description = str(payload.get('description', '')).strip()
    category = str(payload.get('category', '')).strip() or 'General'
    pricing_model = _coerce_pricing_model(str(payload.get('pricing_model', 'free')))
    company = str(payload.get('company', '')).strip() or None

    if not name:
        raise ValueError('Body field "name" is required.')
    if not website_url:
        raise ValueError('Body field "website_url" is required.')
    if not description:
        raise ValueError('Body field "description" is required.')

    return {
        'name': name,
        'website_url': website_url,
        'description': description,
        'category': category,
        'pricing_model': pricing_model,
        'company': company,
    }


def _next_fallback_slug(base_slug: str) -> str:
    existing = {tool['id'] for tool in FALLBACK_TOOLS}
    if base_slug not in existing:
        return base_slug

    suffix = 2
    while True:
        candidate = f'{base_slug}-{suffix}'
        if candidate not in existing:
            return candidate
        suffix += 1


def _submit_tool_fallback(payload: dict[str, Any], user: dict[str, Any]) -> dict[str, Any]:
    slug = _next_fallback_slug(_slugify(payload['name']))
    tool = {
        'id': slug,
        'name': payload['name'],
        'category': payload['category'],
        'description': payload['description'],
        'url': payload['website_url'],
        'pricing': 'Free' if payload['pricing_model'] == 'free' else 'Free + Paid' if payload['pricing_model'] == 'freemium' else 'Paid',
        'score': 70,
        'developer': payload['company'] or user.get('email') or 'Community',
        'trending': False,
        'tags': ['community-submitted'],
        'features': [],
        'pros': [],
        'cons': [],
        'lastUpdated': datetime.utcnow().date().isoformat(),
        'userBase': 'New',
        'scoreBreakdown': {'accuracy': 70, 'speed': 70, 'ease': 70, 'value': 70},
    }
    FALLBACK_TOOLS.insert(0, tool)
    return _as_tool_payload(tool)


def _submit_tool_db(payload: dict[str, Any], user: dict[str, Any]) -> dict[str, Any]:
    category_slug = _slugify(payload['category'])
    tool_slug_base = _slugify(payload['name'])

    with get_connection() as conn:
        with conn.cursor(row_factory=None) as cur:
            cur.execute(
                '''
                INSERT INTO categories (name, slug, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (slug)
                DO UPDATE SET name = EXCLUDED.name
                RETURNING id
                ''',
                (payload['category'], category_slug, 'Community submitted category'),
            )
            category_id = cur.fetchone()[0]

            tool_slug = tool_slug_base
            suffix = 2
            while True:
                cur.execute('SELECT 1 FROM tools WHERE slug = %s LIMIT 1', (tool_slug,))
                if not cur.fetchone():
                    break
                tool_slug = f'{tool_slug_base}-{suffix}'
                suffix += 1

            cur.execute(
                '''
                INSERT INTO tools (
                    name,
                    slug,
                    description_short,
                    website_url,
                    pricing_model,
                    company,
                    performance_score,
                    popularity_score,
                    value_score,
                    metadata
                ) VALUES (%s, %s, %s, %s, %s::pricing_model_enum, %s, %s, %s, %s, %s::jsonb)
                RETURNING id
                ''',
                (
                    payload['name'],
                    tool_slug,
                    payload['description'],
                    payload['website_url'],
                    payload['pricing_model'],
                    payload['company'],
                    70,
                    70,
                    70,
                    {
                        'tags': ['community-submitted'],
                        'submitted_by': {'id': user.get('id'), 'email': user.get('email')},
                        'submitted_at': datetime.utcnow().isoformat() + 'Z',
                    },
                ),
            )
            tool_id = cur.fetchone()[0]

            cur.execute(
                '''
                INSERT INTO tool_categories (tool_id, category_id, is_primary)
                VALUES (%s, %s, TRUE)
                ON CONFLICT (tool_id, category_id)
                DO UPDATE SET is_primary = EXCLUDED.is_primary
                ''',
                (tool_id, category_id),
            )

        conn.commit()

    row = query_one(
        '''
        SELECT t.*, c.name AS category_name
        FROM tools t
        LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
        LEFT JOIN categories c ON c.id = tc.category_id
        WHERE t.id = %s
        LIMIT 1
        ''',
        (tool_id,),
    )
    return _map_db_tool(row) if row else None


def submit_tool(payload: dict[str, Any], user: dict[str, Any]) -> dict[str, Any]:
    normalized = _normalize_submission(payload)
    if db_state.enabled:
        submitted = _submit_tool_db(normalized, user)
        if submitted:
            invalidate_cache('recommend:')
            return submitted
    created = _submit_tool_fallback(normalized, user)
    invalidate_cache('recommend:')
    return created


def list_bookmarks(user: dict[str, Any]) -> dict:
    user_id = str(user.get('id') or '').strip()
    if not user_id:
        return {'items': []}

    if db_state.enabled:
        rows = query_all(
            '''
            SELECT t.*, c.name AS category_name, b.created_at AS bookmarked_at
            FROM bookmarks b
            JOIN tools t ON t.id = b.tool_id
            LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
            LEFT JOIN categories c ON c.id = tc.category_id
            WHERE b.user_id = %s::uuid
            ORDER BY b.created_at DESC
            ''',
            (user_id,),
        )
        items = []
        for row in rows:
            payload = _map_db_tool(row)
            payload['bookmarked_at'] = row.get('bookmarked_at').isoformat() if row.get('bookmarked_at') else None
            items.append(payload)
        return {'items': items}

    saved = FALLBACK_BOOKMARKS.get(user_id, set())
    items = []
    for slug in saved:
        tool = next((entry for entry in FALLBACK_TOOLS if entry['id'] == slug), None)
        if tool:
            items.append(_as_tool_payload(tool))
    items.sort(key=lambda item: item.get('score', 0), reverse=True)
    return {'items': items}


def add_bookmark(user: dict[str, Any], tool_slug: str) -> dict:
    user_id = str(user.get('id') or '').strip()
    slug = str(tool_slug or '').strip().lower()
    if not user_id:
        raise ValueError('User identifier is missing.')
    if not slug:
        raise ValueError('Tool slug is required.')

    tool = get_tool_by_slug(slug)
    if not tool:
        raise ValueError(f"No tool found for slug '{slug}'.")

    if db_state.enabled:
        row = query_one('SELECT id FROM tools WHERE slug = %s LIMIT 1', (slug,))
        if not row:
            raise ValueError(f"No tool found for slug '{slug}'.")

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    INSERT INTO bookmarks (user_id, tool_id)
                    VALUES (%s::uuid, %s::uuid)
                    ON CONFLICT (user_id, tool_id) DO NOTHING
                    ''',
                    (user_id, row['id']),
                )
            conn.commit()

        invalidate_cache(f'feed:{user_id}:')
        invalidate_cache(f'notifications:{user_id}:')
        return {'item': tool, 'message': 'Bookmarked.'}

    FALLBACK_BOOKMARKS.setdefault(user_id, set()).add(slug)
    invalidate_cache(f'feed:{user_id}:')
    invalidate_cache(f'notifications:{user_id}:')
    return {'item': tool, 'message': 'Bookmarked.'}


def remove_bookmark(user: dict[str, Any], tool_slug: str) -> dict:
    user_id = str(user.get('id') or '').strip()
    slug = str(tool_slug or '').strip().lower()
    if not user_id:
        raise ValueError('User identifier is missing.')
    if not slug:
        raise ValueError('Tool slug is required.')

    if db_state.enabled:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    DELETE FROM bookmarks
                    WHERE user_id = %s::uuid
                      AND tool_id IN (SELECT id FROM tools WHERE slug = %s)
                    ''',
                    (user_id, slug),
                )
            conn.commit()
        invalidate_cache(f'feed:{user_id}:')
        invalidate_cache(f'notifications:{user_id}:')
        return {'message': 'Bookmark removed.'}

    saved = FALLBACK_BOOKMARKS.setdefault(user_id, set())
    saved.discard(slug)
    invalidate_cache(f'feed:{user_id}:')
    invalidate_cache(f'notifications:{user_id}:')
    return {'message': 'Bookmark removed.'}


def list_collections(user: dict[str, Any]) -> dict:
    user_id = str(user.get('id') or '').strip()
    if not user_id:
        return {'items': []}

    if db_state.enabled:
        rows = query_all(
            '''
            SELECT c.id, c.name, c.description, c.is_public,
                   c.user_id::text AS user_id,
                   c.created_at,
                   COUNT(ct.tool_id)::int AS tool_count
            FROM collections c
            LEFT JOIN collection_tools ct ON ct.collection_id = c.id
            WHERE c.user_id = %s::uuid
            GROUP BY c.id
            ORDER BY c.created_at DESC
            ''',
            (user_id,),
        )

        items = []
        for row in rows:
            tools = query_all(
                '''
                SELECT t.slug
                FROM collection_tools ct
                JOIN tools t ON t.id = ct.tool_id
                WHERE ct.collection_id = %s::uuid
                ORDER BY ct.added_at DESC
                ''',
                (row['id'],),
            )
            items.append(
                {
                    'id': str(row['id']),
                    'name': row.get('name'),
                    'description': row.get('description') or '',
                    'is_public': bool(row.get('is_public')),
                    'user_id': row.get('user_id'),
                    'tool_count': int(row.get('tool_count') or 0),
                    'tool_slugs': [entry['slug'] for entry in tools],
                    'created_at': row.get('created_at').isoformat() if row.get('created_at') else None,
                }
            )

        return {'items': items}

    items = FALLBACK_COLLECTIONS.get(user_id, [])
    return {'items': items}


def create_collection(user: dict[str, Any], payload: dict[str, Any]) -> dict:
    user_id = str(user.get('id') or '').strip()
    if not user_id:
        raise ValueError('User identifier is missing.')

    name = str(payload.get('name') or '').strip()
    description = str(payload.get('description') or '').strip()
    is_public = bool(payload.get('is_public', False))

    if not name:
        raise ValueError('Body field "name" is required.')

    if db_state.enabled:
        row = query_one(
            '''
            INSERT INTO collections (user_id, name, description, is_public)
            VALUES (%s::uuid, %s, %s, %s)
            RETURNING id, name, description, is_public, user_id::text AS user_id, created_at
            ''',
            (user_id, name, description or None, is_public),
        )
        return {
            'id': str(row['id']),
            'name': row.get('name'),
            'description': row.get('description') or '',
            'is_public': bool(row.get('is_public')),
            'user_id': row.get('user_id'),
            'tool_count': 0,
            'tool_slugs': [],
            'created_at': row.get('created_at').isoformat() if row.get('created_at') else None,
        }

    collection = {
        'id': str(uuid4()),
        'name': name,
        'description': description,
        'is_public': is_public,
        'user_id': user_id,
        'tool_count': 0,
        'tool_slugs': [],
        'created_at': datetime.utcnow().isoformat() + 'Z',
    }
    FALLBACK_COLLECTIONS.setdefault(user_id, []).insert(0, collection)
    return collection


def delete_collection(user: dict[str, Any], collection_id: str) -> dict:
    user_id = str(user.get('id') or '').strip()
    collection_id = str(collection_id or '').strip()
    if not user_id:
        raise ValueError('User identifier is missing.')
    if not collection_id:
        raise ValueError('Collection identifier is required.')

    if db_state.enabled:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'DELETE FROM collections WHERE id = %s::uuid AND user_id = %s::uuid',
                    (collection_id, user_id),
                )
                deleted = cur.rowcount
            conn.commit()
        if deleted == 0:
            raise ValueError('Collection not found.')
        return {'message': 'Collection deleted.'}

    items = FALLBACK_COLLECTIONS.setdefault(user_id, [])
    next_items = [item for item in items if item.get('id') != collection_id]
    if len(next_items) == len(items):
        raise ValueError('Collection not found.')
    FALLBACK_COLLECTIONS[user_id] = next_items
    return {'message': 'Collection deleted.'}


def add_tool_to_collection(user: dict[str, Any], collection_id: str, tool_slug: str) -> dict:
    user_id = str(user.get('id') or '').strip()
    collection_id = str(collection_id or '').strip()
    slug = str(tool_slug or '').strip().lower()
    if not user_id:
        raise ValueError('User identifier is missing.')
    if not collection_id:
        raise ValueError('Collection identifier is required.')
    if not slug:
        raise ValueError('Tool slug is required.')

    tool = get_tool_by_slug(slug)
    if not tool:
        raise ValueError(f"No tool found for slug '{slug}'.")

    if db_state.enabled:
        collection = query_one('SELECT id FROM collections WHERE id = %s::uuid AND user_id = %s::uuid', (collection_id, user_id))
        if not collection:
            raise ValueError('Collection not found.')

        tool_row = query_one('SELECT id FROM tools WHERE slug = %s LIMIT 1', (slug,))
        if not tool_row:
            raise ValueError(f"No tool found for slug '{slug}'.")

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    INSERT INTO collection_tools (collection_id, tool_id)
                    VALUES (%s::uuid, %s::uuid)
                    ON CONFLICT (collection_id, tool_id) DO NOTHING
                    ''',
                    (collection_id, tool_row['id']),
                )
            conn.commit()

        return {'item': tool, 'message': 'Tool added to collection.'}

    items = FALLBACK_COLLECTIONS.setdefault(user_id, [])
    collection = next((item for item in items if item.get('id') == collection_id), None)
    if not collection:
        raise ValueError('Collection not found.')

    slugs = list(collection.get('tool_slugs', []))
    if slug not in slugs:
        slugs.append(slug)
    collection['tool_slugs'] = slugs
    collection['tool_count'] = len(slugs)
    return {'item': tool, 'message': 'Tool added to collection.'}


def remove_tool_from_collection(user: dict[str, Any], collection_id: str, tool_slug: str) -> dict:
    user_id = str(user.get('id') or '').strip()
    collection_id = str(collection_id or '').strip()
    slug = str(tool_slug or '').strip().lower()
    if not user_id:
        raise ValueError('User identifier is missing.')
    if not collection_id:
        raise ValueError('Collection identifier is required.')
    if not slug:
        raise ValueError('Tool slug is required.')

    if db_state.enabled:
        collection = query_one('SELECT id FROM collections WHERE id = %s::uuid AND user_id = %s::uuid', (collection_id, user_id))
        if not collection:
            raise ValueError('Collection not found.')

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    DELETE FROM collection_tools
                    WHERE collection_id = %s::uuid
                      AND tool_id IN (SELECT id FROM tools WHERE slug = %s)
                    ''',
                    (collection_id, slug),
                )
            conn.commit()

        return {'message': 'Tool removed from collection.'}

    items = FALLBACK_COLLECTIONS.setdefault(user_id, [])
    collection = next((item for item in items if item.get('id') == collection_id), None)
    if not collection:
        raise ValueError('Collection not found.')

    slugs = [entry for entry in list(collection.get('tool_slugs', [])) if entry != slug]
    collection['tool_slugs'] = slugs
    collection['tool_count'] = len(slugs)
    return {'message': 'Tool removed from collection.'}


def list_reviews(tool_slug: str, limit: int = 20) -> dict:
    slug = str(tool_slug or '').strip().lower()
    if not slug:
        return {'items': []}

    safe_limit = max(1, min(int(limit or 20), 100))

    if db_state.enabled:
        row = query_one('SELECT id FROM tools WHERE slug = %s LIMIT 1', (slug,))
        if not row:
            return {'items': []}

        rows = query_all(
            '''
            SELECT id, user_id::text AS user_id, rating, title, body, use_case, created_at, helpful_count
            FROM reviews
            WHERE tool_id = %s::uuid
            ORDER BY created_at DESC
            LIMIT %s
            ''',
            (row['id'], safe_limit),
        )

        items = []
        for entry in rows:
            items.append(
                {
                    'id': str(entry.get('id')),
                    'tool_slug': slug,
                    'user_id': entry.get('user_id'),
                    'rating': int(entry.get('rating') or 0),
                    'title': entry.get('title') or '',
                    'comment': entry.get('body') or '',
                    'use_case': entry.get('use_case') or '',
                    'helpful_count': int(entry.get('helpful_count') or 0),
                    'created_at': entry.get('created_at').isoformat() if entry.get('created_at') else None,
                }
            )

        return {'items': items}

    items = list(FALLBACK_REVIEWS.get(slug, []))
    items.sort(key=lambda item: item.get('created_at') or '', reverse=True)
    return {'items': items[:safe_limit]}


def submit_review(user: dict[str, Any], tool_slug: str, payload: dict[str, Any]) -> dict:
    user_id = str(user.get('id') or '').strip()
    slug = str(tool_slug or '').strip().lower()
    if not user_id:
        raise ValueError('User identifier is missing.')
    if not slug:
        raise ValueError('Tool slug is required.')

    tool = get_tool_by_slug(slug)
    if not tool:
        raise ValueError(f"No tool found for slug '{slug}'.")

    rating = int(payload.get('rating', 0))
    comment = str(payload.get('comment') or '').strip()
    title = str(payload.get('title') or '').strip()
    use_case = str(payload.get('use_case') or '').strip()

    if rating < 1 or rating > 5:
        raise ValueError('Rating must be between 1 and 5.')
    if not comment:
        raise ValueError('Body field "comment" is required.')

    if db_state.enabled:
        tool_row = query_one('SELECT id FROM tools WHERE slug = %s LIMIT 1', (slug,))
        if not tool_row:
            raise ValueError(f"No tool found for slug '{slug}'.")

        row = query_one(
            '''
            INSERT INTO reviews (tool_id, user_id, rating, title, body, use_case)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s)
            RETURNING id, user_id::text AS user_id, rating, title, body, use_case, created_at, helpful_count
            ''',
            (tool_row['id'], user_id, rating, title or None, comment, use_case or None),
        )

        return {
            'item': {
                'id': str(row.get('id')),
                'tool_slug': slug,
                'user_id': row.get('user_id'),
                'rating': int(row.get('rating') or 0),
                'title': row.get('title') or '',
                'comment': row.get('body') or '',
                'use_case': row.get('use_case') or '',
                'helpful_count': int(row.get('helpful_count') or 0),
                'created_at': row.get('created_at').isoformat() if row.get('created_at') else None,
            },
            'message': 'Review submitted.',
        }

    entry = {
        'id': str(uuid4()),
        'tool_slug': slug,
        'user_id': user_id,
        'rating': rating,
        'title': title,
        'comment': comment,
        'use_case': use_case,
        'helpful_count': 0,
        'created_at': datetime.utcnow().isoformat() + 'Z',
    }
    FALLBACK_REVIEWS.setdefault(slug, []).insert(0, entry)
    return {'item': entry, 'message': 'Review submitted.'}


def personalized_feed(user: dict[str, Any], limit: int = 10, profile_preferences: dict[str, Any] | None = None) -> dict:
    user_id = str(user.get('id') or '').strip()
    if not user_id:
        return {'items': [], 'context': {'preferred_categories': [], 'bookmarked_count': 0}}

    safe_limit = max(1, min(int(limit or 10), 50))
    profile = profile_preferences or {}
    preferred_categories_override = [str(item).strip() for item in (profile.get('preferred_categories') or []) if str(item).strip()]
    preferred_set = {item.lower() for item in preferred_categories_override}
    budget_mode = str(profile.get('budget_mode', 'mixed')).lower()
    if budget_mode not in {'free', 'mixed', 'premium'}:
        budget_mode = 'mixed'
    skill_level = str(profile.get('skill_level', 'intermediate')).lower()
    opt_in_personalization = bool(profile.get('opt_in_personalization', True))

    feed_cache_key = make_cache_key(
        f'feed:{user_id}',
        {
            'limit': safe_limit,
            'preferred_categories': preferred_categories_override,
            'budget_mode': budget_mode,
            'skill_level': skill_level,
            'opt_in_personalization': opt_in_personalization,
        },
    )
    cached_feed = get_cached(feed_cache_key)
    if cached_feed is not None:
        return cached_feed

    if db_state.enabled:
        bookmarked_rows = query_all(
            '''
            SELECT t.slug, COALESCE(c.name, 'General') AS category_name
            FROM bookmarks b
            JOIN tools t ON t.id = b.tool_id
            LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
            LEFT JOIN categories c ON c.id = tc.category_id
            WHERE b.user_id = %s::uuid
            ''',
            (user_id,),
        )

        bookmarked_slugs = {row['slug'] for row in bookmarked_rows}
        category_counts: dict[str, int] = {}
        for row in bookmarked_rows:
            category_name = row.get('category_name') or 'General'
            category_counts[category_name] = category_counts.get(category_name, 0) + 1

        preferred_categories = [name for name, _count in sorted(category_counts.items(), key=lambda entry: entry[1], reverse=True)[:3]]
        if preferred_categories_override:
            preferred_categories = preferred_categories_override

        rows = query_all(
            '''
            SELECT t.*, c.name AS category_name
            FROM tools t
            LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
            LEFT JOIN categories c ON c.id = tc.category_id
            WHERE t.is_active = TRUE
            ORDER BY t.popularity_score DESC
            LIMIT 150
            ''',
        )

        scored: list[tuple[int, dict]] = []
        for row in rows:
            item = _map_db_tool(row)
            if item['id'] in bookmarked_slugs:
                continue

            score = int(item.get('score', 0))
            if item.get('trending'):
                score += 8
            if opt_in_personalization and item.get('category', '').lower() in preferred_set:
                score += 16
            elif opt_in_personalization and item.get('category') in preferred_categories:
                score += 12
            if budget_mode == 'free':
                score += 7 if item.get('pricing_model') in {'free', 'freemium'} else -6
            elif budget_mode == 'premium':
                score += 6 if item.get('pricing_model') in {'paid', 'enterprise'} else 0

            ease_score = int((item.get('scoreBreakdown') or {}).get('ease') or item.get('score') or 0)
            if skill_level == 'beginner':
                score += 6 if ease_score >= 85 else 0
            elif skill_level == 'advanced':
                score += 4 if 'api' in ' '.join(item.get('tags') or []).lower() else 0

            scored.append((score, item))

        scored.sort(key=lambda entry: entry[0], reverse=True)
        items = [item for _, item in scored[:safe_limit]]

        result = {
            'items': items,
            'context': {
                'preferred_categories': preferred_categories,
                'bookmarked_count': len(bookmarked_slugs),
                'profile_preferences': {
                    'budget_mode': budget_mode,
                    'skill_level': skill_level,
                    'opt_in_personalization': opt_in_personalization,
                },
            },
        }
        set_cached(feed_cache_key, result, ttl_seconds=45)
        return result

    bookmarked_slugs = FALLBACK_BOOKMARKS.get(user_id, set())
    category_counts: dict[str, int] = {}
    for slug in bookmarked_slugs:
        tool = next((entry for entry in FALLBACK_TOOLS if entry['id'] == slug), None)
        if tool:
            category = tool.get('category') or 'General'
            category_counts[category] = category_counts.get(category, 0) + 1

    preferred_categories = [name for name, _count in sorted(category_counts.items(), key=lambda entry: entry[1], reverse=True)[:3]]
    if preferred_categories_override:
        preferred_categories = preferred_categories_override

    scored: list[tuple[int, dict]] = []
    for entry in FALLBACK_TOOLS:
        if entry['id'] in bookmarked_slugs:
            continue
        item = _as_tool_payload(entry)
        score = int(item.get('score', 0))
        if item.get('trending'):
            score += 8
        if opt_in_personalization and item.get('category', '').lower() in preferred_set:
            score += 16
        elif opt_in_personalization and item.get('category') in preferred_categories:
            score += 12
        if budget_mode == 'free':
            score += 7 if item.get('pricing_model') in {'free', 'freemium'} else -6
        elif budget_mode == 'premium':
            score += 6 if item.get('pricing_model') in {'paid', 'enterprise'} else 0

        ease_score = int((item.get('scoreBreakdown') or {}).get('ease') or item.get('score') or 0)
        if skill_level == 'beginner':
            score += 6 if ease_score >= 85 else 0
        elif skill_level == 'advanced':
            score += 4 if 'api' in ' '.join(item.get('tags') or []).lower() else 0
        scored.append((score, item))

    scored.sort(key=lambda row: row[0], reverse=True)
    result = {
        'items': [item for _, item in scored[:safe_limit]],
        'context': {
            'preferred_categories': preferred_categories,
            'bookmarked_count': len(bookmarked_slugs),
            'profile_preferences': {
                'budget_mode': budget_mode,
                'skill_level': skill_level,
                'opt_in_personalization': opt_in_personalization,
            },
        },
    }
    set_cached(feed_cache_key, result, ttl_seconds=45)
    return result


def list_notifications(user: dict[str, Any], limit: int = 10, profile_preferences: dict[str, Any] | None = None) -> dict:
    safe_limit = max(1, min(int(limit or 10), 50))
    user_id = str(user.get('id') or '').strip()
    profile = profile_preferences or {}
    if not bool(profile.get('notifications_enabled', True)):
        return {'items': [], 'context': {'notifications_enabled': False}}

    notifications_cache_key = make_cache_key(
        f'notifications:{user_id or "anon"}',
        {
            'limit': safe_limit,
            'notifications_enabled': bool(profile.get('notifications_enabled', True)),
            'preferred_categories': profile.get('preferred_categories') or [],
            'budget_mode': profile.get('budget_mode', 'mixed'),
            'skill_level': profile.get('skill_level', 'intermediate'),
            'opt_in_personalization': bool(profile.get('opt_in_personalization', True)),
        },
    )
    cached_notifications = get_cached(notifications_cache_key)
    if cached_notifications is not None:
        return cached_notifications

    feed = personalized_feed(user, safe_limit, profile)
    items = []
    timestamp = datetime.utcnow().isoformat() + 'Z'

    preferred = feed.get('context', {}).get('preferred_categories', [])
    for index, tool in enumerate(feed.get('items', [])[:safe_limit], start=1):
        category = tool.get('category') or 'General'
        preferred_marker = ' in your preferred categories' if category in preferred else ''
        items.append(
            {
                'id': f'notif-{tool.get("id")}-{index}',
                'type': 'tool_suggestion',
                'title': f'New match: {tool.get("name")}',
                'message': f'{tool.get("name")} is trending{preferred_marker}.',
                'tool_slug': tool.get('id'),
                'created_at': timestamp,
            }
        )

    result = {
        'items': items[:safe_limit],
        'context': feed.get('context', {}),
    }
    set_cached(notifications_cache_key, result, ttl_seconds=30)
    return result


def tool_analytics(user: dict[str, Any], tool_slug: str) -> dict:
    _user_id = str(user.get('id') or '').strip()
    slug = str(tool_slug or '').strip().lower()
    if not slug:
        raise ValueError('Tool slug is required.')

    tool = get_tool_by_slug(slug)
    if not tool:
        raise ValueError(f"No tool found for slug '{slug}'.")

    if db_state.enabled:
        tool_row = query_one('SELECT id FROM tools WHERE slug = %s LIMIT 1', (slug,))
        if not tool_row:
            raise ValueError(f"No tool found for slug '{slug}'.")

        bookmarks_row = query_one('SELECT COUNT(*)::int AS count FROM bookmarks WHERE tool_id = %s::uuid', (tool_row['id'],))
        collections_row = query_one('SELECT COUNT(*)::int AS count FROM collection_tools WHERE tool_id = %s::uuid', (tool_row['id'],))
        reviews_row = query_one(
            '''
            SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS avg_rating
            FROM reviews
            WHERE tool_id = %s::uuid
            ''',
            (tool_row['id'],),
        )
        latest_reviews = query_all(
            '''
            SELECT body, rating, created_at
            FROM reviews
            WHERE tool_id = %s::uuid
            ORDER BY created_at DESC
            LIMIT 5
            ''',
            (tool_row['id'],),
        )

        score = int(tool.get('score', 0))
        bookmarks_count = int((bookmarks_row or {}).get('count') or 0)
        collections_count = int((collections_row or {}).get('count') or 0)
        reviews_count = int((reviews_row or {}).get('count') or 0)
        avg_rating = round(float((reviews_row or {}).get('avg_rating') or 0), 2)

        trend_index = score + bookmarks_count * 2 + collections_count * 2 + reviews_count * 3
        return {
            'tool': {
                'id': tool.get('id'),
                'name': tool.get('name'),
                'category': tool.get('category'),
            },
            'metrics': {
                'bookmarks': bookmarks_count,
                'collections': collections_count,
                'reviews': reviews_count,
                'average_rating': avg_rating,
                'trend_index': trend_index,
            },
            'latest_reviews': [
                {
                    'comment': row.get('body') or '',
                    'rating': int(row.get('rating') or 0),
                    'created_at': row.get('created_at').isoformat() if row.get('created_at') else None,
                }
                for row in latest_reviews
            ],
        }

    bookmarks_count = sum(1 for saved in FALLBACK_BOOKMARKS.values() if slug in saved)
    collections_count = 0
    for collections in FALLBACK_COLLECTIONS.values():
        collections_count += sum(1 for entry in collections if slug in (entry.get('tool_slugs') or []))

    review_entries = FALLBACK_REVIEWS.get(slug, [])
    reviews_count = len(review_entries)
    avg_rating = round(sum(entry.get('rating', 0) for entry in review_entries) / reviews_count, 2) if reviews_count else 0
    score = int(tool.get('score', 0))
    trend_index = score + bookmarks_count * 2 + collections_count * 2 + reviews_count * 3

    return {
        'tool': {
            'id': tool.get('id'),
            'name': tool.get('name'),
            'category': tool.get('category'),
        },
        'metrics': {
            'bookmarks': bookmarks_count,
            'collections': collections_count,
            'reviews': reviews_count,
            'average_rating': avg_rating,
            'trend_index': trend_index,
        },
        'latest_reviews': [
            {
                'comment': entry.get('comment') or '',
                'rating': int(entry.get('rating') or 0),
                'created_at': entry.get('created_at'),
            }
            for entry in review_entries[:5]
        ],
    }


def _pricing_mode(label: str) -> str:
    value = (label or '').lower()
    if 'paid' in value and ('free' in value or 'freemium' in value):
        return 'freemium'
    if 'paid' in value:
        return 'paid'
    return 'free'


def _as_tool_payload(tool: dict) -> dict:
    score = int(tool.get('score', 0))
    return {
        **tool,
        'slug': tool['id'],
        'pricing_model': _pricing_mode(tool.get('pricing', '')),
        'popularity_score': score,
        'performance_score': int(tool.get('scoreBreakdown', {}).get('accuracy', score)),
        'value_score': int(tool.get('scoreBreakdown', {}).get('value', score)),
        'community_rating': round(max(1, min(5, score / 20)), 1),
    }


def _map_db_tool(row: dict) -> dict:
    metadata = row.get('metadata') or {}
    score = int(row.get('popularity_score') or row.get('performance_score') or 0)
    pricing_model = row.get('pricing_model', 'free')

    if pricing_model == 'freemium':
        pricing = 'Free + Paid'
    elif pricing_model == 'paid':
        pricing = 'Paid'
    elif pricing_model == 'enterprise':
        pricing = 'Paid'
    else:
        pricing = 'Free'

    return {
        'id': row['slug'],
        'slug': row['slug'],
        'name': row['name'],
        'category': row.get('category_name') or 'General',
        'description': row.get('description_short') or row.get('description_long') or 'No description available.',
        'url': row.get('website_url'),
        'pricing': pricing,
        'pricing_model': pricing_model,
        'tags': metadata.get('tags', []),
        'features': metadata.get('features', []),
        'pros': row.get('pros', []),
        'cons': row.get('cons', []),
        'developer': row.get('company'),
        'score': score,
        'scoreBreakdown': {
            'accuracy': int(row.get('performance_score') or score),
            'speed': int(row.get('performance_score') or score),
            'ease': int(metadata.get('ease_score', score)),
            'value': int(row.get('value_score') or score),
        },
        'trending': score >= 90,
        'lastUpdated': row.get('updated_at').date().isoformat() if row.get('updated_at') else None,
        'userBase': metadata.get('userBase'),
        'popularity_score': score,
        'performance_score': int(row.get('performance_score') or score),
        'value_score': int(row.get('value_score') or score),
        'community_rating': round(max(1, min(5, score / 20)), 1),
    }


def _safe_int(value, fallback: int) -> int:
    try:
        parsed = int(value)
        return parsed if parsed > 0 else fallback
    except Exception:
        return fallback


def _build_fallback_categories() -> list[dict]:
    tool_counts: dict[str, int] = {}
    for tool in FALLBACK_TOOLS:
        category_name = tool.get('category') or 'General'
        tool_counts[category_name] = tool_counts.get(category_name, 0) + 1

    names = sorted(set(EXTENDED_CATEGORY_TAXONOMY) | set(tool_counts.keys()))
    categories = [{'name': 'All', 'slug': 'all', 'tool_count': len(FALLBACK_TOOLS)}]
    for name in names:
        categories.append(
            {
                'name': name,
                'slug': name.lower().replace(' ', '-'),
                'tool_count': tool_counts.get(name, 0),
            }
        )
    return categories


def _is_catalog_wide_query(query: dict) -> bool:
    category = (query.get('category') or 'All')
    pricing = query.get('pricing')
    search = (query.get('q') or '').strip()
    trending = query.get('trending') == 'true'
    return category == 'All' and not pricing and not search and not trending


def _empty_tools_listing(query: dict) -> dict:
    page = _safe_int(query.get('page', 1), 1)
    limit = min(_safe_int(query.get('limit', 20), 20), 2500)
    return {
        'items': [],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': 0,
            'totalPages': 1,
        },
    }


def _merge_tools(primary: list[dict], secondary: list[dict]) -> list[dict]:
    merged: list[dict] = []
    seen: set[str] = set()

    for tool in [*(primary or []), *(secondary or [])]:
        slug = str(tool.get('id') or tool.get('slug') or '').strip().lower()
        if not slug or slug in seen:
            continue
        seen.add(slug)
        merged.append(tool)

    return merged


def _db_has_sparse_catalog(total: int, query: dict) -> bool:
    return _is_catalog_wide_query(query) and total < 25


def list_tools(query: dict) -> dict:
    if db_state.enabled:
        try:
            return _list_tools_db(query)
        except Exception as error:
            db_state.enabled = False
            db_state.last_error = str(error)
    return _list_tools_fallback(query)


def _list_tools_fallback(query: dict) -> dict:
    page = _safe_int(query.get('page', 1), 1)
    limit = min(_safe_int(query.get('limit', 20), 20), 2500)
    category = query.get('category', 'All')
    pricing = query.get('pricing')
    search = (query.get('q') or '').strip().lower()
    trending = query.get('trending') == 'true'
    sort = query.get('sort', 'score')

    items = [tool for tool in FALLBACK_TOOLS if category == 'All' or tool['category'] == category]

    if pricing:
        if pricing == 'free':
            items = [tool for tool in items if _pricing_mode(tool.get('pricing', '')) in {'free', 'freemium'}]
        else:
            items = [tool for tool in items if _pricing_mode(tool.get('pricing', '')) in {'paid', 'enterprise'}]

    if search:
        items = [
            tool
            for tool in items
            if search in f"{tool['name']} {tool['description']} {' '.join(tool.get('tags', []))}".lower()
        ]

    if trending:
        items = [tool for tool in items if tool.get('trending')]

    if sort == 'name':
        items.sort(key=lambda tool: tool['name'])
    elif sort == 'utility':
        items.sort(
            key=lambda tool: (
                tool.get('scoreBreakdown', {}).get('accuracy', 0)
                + tool.get('scoreBreakdown', {}).get('value', 0)
                + tool.get('score', 0)
            ),
            reverse=True,
        )
    else:
        items.sort(key=lambda tool: tool.get('score', 0), reverse=True)

    total = len(items)
    start = (page - 1) * limit
    data = [_as_tool_payload(tool) for tool in items[start:start + limit]]

    return {
        'items': data,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'totalPages': max(1, (total + limit - 1) // limit),
        },
    }


def _list_tools_db(query: dict) -> dict:
    page = _safe_int(query.get('page', 1), 1)
    limit = min(_safe_int(query.get('limit', 20), 20), 2500)
    category = query.get('category', 'All')
    pricing = query.get('pricing')
    search = (query.get('q') or '').strip()
    trending = query.get('trending') == 'true'
    sort = query.get('sort', 'score')
    offset = (page - 1) * limit

    where = [
        't.is_active = TRUE',
        "COALESCE(t.metadata->>'source', 'seed') <> 'generated'",
        "COALESCE(t.website_url, '') <> ''",
        "t.website_url ~* '^https?://'",
    ]
    params: list = []

    if category != 'All':
        where.append('c.name = %s')
        params.append(category)

    if pricing:
        if pricing == 'free':
            where.append("t.pricing_model = ANY(%s)")
            params.append(['free', 'freemium'])
        else:
            where.append("t.pricing_model = ANY(%s)")
            params.append(['paid', 'enterprise'])

    if search:
        where.append("(t.name ILIKE %s OR COALESCE(t.description_short, '') ILIKE %s OR COALESCE(t.company, '') ILIKE %s)")
        wildcard = f'%{search}%'
        params.extend([wildcard, wildcard, wildcard])

    if trending:
        where.append('t.popularity_score >= 90')

    where_sql = ' AND '.join(where)

    if sort == 'name':
        order_sql = 't.name ASC'
    elif sort == 'utility':
        order_sql = '(t.performance_score + t.value_score + t.popularity_score) DESC'
    else:
        order_sql = 't.popularity_score DESC'

    total_row = query_one(
        f'''
        SELECT COUNT(DISTINCT t.id)::int AS total
        FROM tools t
        LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
        LEFT JOIN categories c ON c.id = tc.category_id
        WHERE {where_sql}
        ''',
        tuple(params),
    )

    rows = query_all(
        f'''
        SELECT DISTINCT ON (t.id) t.*, c.name AS category_name
        FROM tools t
        LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
        LEFT JOIN categories c ON c.id = tc.category_id
        WHERE {where_sql}
        ORDER BY t.id, {order_sql}
        LIMIT %s OFFSET %s
        ''',
        tuple(params + [limit, offset]),
    )

    items = [_map_db_tool(row) for row in rows]
    total = int((total_row or {}).get('total', 0))

    if _db_has_sparse_catalog(total, query):
        full_rows = query_all(
            f'''
            SELECT DISTINCT ON (t.id) t.*, c.name AS category_name
            FROM tools t
            LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
            LEFT JOIN categories c ON c.id = tc.category_id
            WHERE {where_sql}
            ORDER BY t.id, {order_sql}
            LIMIT %s OFFSET %s
            ''',
            tuple(params + [2500, 0]),
        )
        db_items_all = [_map_db_tool(row) for row in full_rows]
        fallback_listing = _list_tools_fallback({**query, 'page': 1, 'limit': 2500})
        merged_all = _merge_tools(db_items_all, fallback_listing.get('items', []))

        start = max(0, offset)
        page_items = merged_all[start:start + limit]
        merged_total = len(merged_all)
        return {
            'items': page_items,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': merged_total,
                'totalPages': max(1, (merged_total + limit - 1) // limit),
            },
        }

    return {
        'items': items,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'totalPages': max(1, (total + limit - 1) // limit),
        },
    }


def get_tool_by_slug(slug: str) -> dict | None:
    normalized_slug = str(slug or '').strip().lower()

    if not db_state.enabled:
        fallback_tool = next((entry for entry in FALLBACK_TOOLS if entry.get('id') == normalized_slug), None)
        return _as_tool_payload(fallback_tool) if fallback_tool else None

    row = query_one(
        '''
        SELECT t.*, c.name AS category_name
        FROM tools t
        LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
        LEFT JOIN categories c ON c.id = tc.category_id
                WHERE t.slug = %s
                    AND t.is_active = TRUE
                    AND COALESCE(t.metadata->>'source', 'seed') <> 'generated'
                    AND COALESCE(t.website_url, '') <> ''
                    AND t.website_url ~* '^https?://'
        LIMIT 1
        ''',
        (normalized_slug,),
    )
    if row:
        return _map_db_tool(row)

    fallback_tool = next((entry for entry in FALLBACK_TOOLS if entry.get('id') == normalized_slug), None)
    return _as_tool_payload(fallback_tool) if fallback_tool else None


def compare_tools(slugs: list[str]) -> dict:
    normalized_slugs = []
    for slug in slugs:
        value = str(slug or '').strip().lower()
        if value and value not in normalized_slugs:
            normalized_slugs.append(value)

    if not normalized_slugs:
        return {
            'generated_at': datetime.utcnow().isoformat() + 'Z',
            'items': [],
            'insights': {'compared_count': 0, 'best_by_score': None},
        }

    if db_state.enabled:
        rows = query_all(
            '''
            SELECT t.*, c.name AS category_name
            FROM tools t
            LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
            LEFT JOIN categories c ON c.id = tc.category_id
                        WHERE t.slug = ANY(%s)
                            AND t.is_active = TRUE
                            AND COALESCE(t.metadata->>'source', 'seed') <> 'generated'
                            AND COALESCE(t.website_url, '') <> ''
                            AND t.website_url ~* '^https?://'
            ''',
            (normalized_slugs,),
        )
        mapped = {_map_db_tool(row)['id']: _map_db_tool(row) for row in rows}
        items = [mapped[slug] for slug in normalized_slugs if slug in mapped]
    else:
        items = []

    if len(items) < len(normalized_slugs):
        fallback_map = {
            entry.get('id'): _as_tool_payload(entry)
            for entry in FALLBACK_TOOLS
            if entry.get('id') in normalized_slugs
        }
        combined = {item.get('id'): item for item in items if item.get('id')}
        for tool_slug in normalized_slugs:
            if tool_slug not in combined and tool_slug in fallback_map:
                combined[tool_slug] = fallback_map[tool_slug]
        items = [combined[tool_slug] for tool_slug in normalized_slugs if tool_slug in combined]

    best = max(items, key=lambda item: item.get('score', 0)) if items else None
    return {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'items': items,
        'insights': {
            'compared_count': len(items),
            'best_by_score': {
                'id': best.get('id'),
                'name': best.get('name'),
                'score': best.get('score'),
            } if best else None,
        },
    }


def get_trending() -> list[dict]:
    return list_tools({'limit': 25, 'trending': 'true', 'sort': 'score'})['items']


def get_new() -> list[dict]:
    if not db_state.enabled:
        return []

    rows = query_all(
        '''
        SELECT t.*, c.name AS category_name
        FROM tools t
        LEFT JOIN tool_categories tc ON tc.tool_id = t.id AND tc.is_primary = TRUE
        LEFT JOIN categories c ON c.id = tc.category_id
                WHERE t.is_active = TRUE
                    AND COALESCE(t.metadata->>'source', 'seed') <> 'generated'
                    AND COALESCE(t.website_url, '') <> ''
                    AND t.website_url ~* '^https?://'
        ORDER BY t.updated_at DESC
        LIMIT 25
        '''
    )
    return [_map_db_tool(row) for row in rows]


def get_top(count: int = 10, sort_by: str = 'score') -> list[dict]:
    sort = 'name' if sort_by == 'name' else 'utility' if sort_by == 'utility' else 'score'
    return list_tools({'limit': count, 'sort': sort})['items']


def list_categories() -> list[dict]:
    if not db_state.enabled:
        return _build_fallback_categories()

    try:
        all_total = query_one(
            '''
            SELECT COUNT(*)::int AS total
            FROM tools
            WHERE is_active = TRUE
              AND COALESCE(metadata->>'source', 'seed') <> 'generated'
              AND COALESCE(website_url, '') <> ''
              AND website_url ~* '^https?://'
            '''
        )
        rows = query_all(
            '''
            SELECT c.name, c.slug, COUNT(t.id)::int AS tool_count
            FROM categories c
            LEFT JOIN tool_categories tc ON tc.category_id = c.id
            LEFT JOIN tools t ON t.id = tc.tool_id
              AND t.is_active = TRUE
              AND COALESCE(t.metadata->>'source', 'seed') <> 'generated'
              AND COALESCE(t.website_url, '') <> ''
              AND t.website_url ~* '^https?://'
            GROUP BY c.id
            ORDER BY c.sort_order ASC, c.name ASC
            '''
        )
        total = int((all_total or {}).get('total', 0))
        db_categories = [{'name': 'All', 'slug': 'all', 'tool_count': total}] + rows
        fallback_categories = _build_fallback_categories()
        fallback_map = {entry['slug']: dict(entry) for entry in fallback_categories}

        for entry in db_categories:
            slug = entry.get('slug')
            if not slug:
                continue
            if slug in fallback_map:
                fallback_map[slug]['tool_count'] += int(entry.get('tool_count') or 0)
            else:
                fallback_map[slug] = dict(entry)

        ordered_slugs = [entry['slug'] for entry in fallback_categories]
        ordered_slugs.extend([entry['slug'] for entry in db_categories if entry.get('slug') not in ordered_slugs])
        return [fallback_map[slug] for slug in ordered_slugs if slug in fallback_map]
    except Exception as error:
        db_state.enabled = False
        db_state.last_error = str(error)
        return _build_fallback_categories()


def _as_public_tool_payload(tool: dict[str, Any]) -> dict[str, Any]:
    return {
        'id': tool.get('id'),
        'slug': tool.get('slug') or tool.get('id'),
        'name': tool.get('name'),
        'category': tool.get('category') or 'General',
        'description': tool.get('description') or '',
        'url': tool.get('url'),
        'pricing': tool.get('pricing'),
        'pricing_model': tool.get('pricing_model'),
        'score': int(tool.get('score') or 0),
        'trending': bool(tool.get('trending')),
        'last_updated': tool.get('lastUpdated'),
    }


def list_public_tools(query: dict[str, Any]) -> dict[str, Any]:
    listing = list_tools(query)
    items = [_as_public_tool_payload(item) for item in listing.get('items', [])]
    return {
        'items': items,
        'pagination': listing.get('pagination') or {},
        'meta': {
            'version': 'v1',
            'dataset': 'public-catalog',
        },
    }


def recommend_stack(
    query_text: str,
    budget: str = 'mixed',
    category: str = 'All',
    follow_up_answers: dict[str, Any] | None = None,
) -> dict:
    candidates = list_tools(
        {
            'limit': 200,
            'category': category,
            'pricing': 'free' if budget == 'free' else 'paid' if budget == 'premium' else None,
            'sort': 'score',
        }
    )['items']

    words = [part.strip().lower() for part in query_text.split() if part.strip()]

    query_categories = {
        'coding': ['code', 'coding', 'developer', 'debug', 'interview'],
        'writing': ['write', 'writing', 'content', 'copy', 'blog', 'seo'],
        'automation': ['automation', 'workflow', 'integration', 'pipeline'],
        'design': ['design', 'ui', 'ux', 'image', 'video', 'creative'],
    }

    inferred_query_categories = [
        name
        for name, keywords in query_categories.items()
        if any(keyword in words for keyword in keywords)
    ]

    normalized_answers = {
        str(key).strip().lower(): str(value).strip().lower()
        for key, value in (follow_up_answers or {}).items()
        if str(key).strip() and str(value).strip()
    }

    recommend_cache_key = make_cache_key(
        'recommend',
        {
            'query_text': query_text,
            'budget': budget,
            'category': category,
            'follow_up_answers': normalized_answers,
        },
    )
    cached_recommendation = get_cached(recommend_cache_key)
    if cached_recommendation is not None:
        return cached_recommendation

    follow_up_questions = [
        {
            'id': 'priority',
            'prompt': 'What matters most for this stack?',
            'options': [
                {'value': 'speed', 'label': 'Fast output'},
                {'value': 'quality', 'label': 'Best quality'},
                {'value': 'ease', 'label': 'Easy onboarding'},
                {'value': 'cost', 'label': 'Lowest cost'},
            ],
        },
        {
            'id': 'experience_level',
            'prompt': 'What is your current skill level?',
            'options': [
                {'value': 'beginner', 'label': 'Beginner'},
                {'value': 'intermediate', 'label': 'Intermediate'},
                {'value': 'advanced', 'label': 'Advanced'},
            ],
        },
        {
            'id': 'integration_need',
            'prompt': 'Do you need API or workflow integrations?',
            'options': [
                {'value': 'yes', 'label': 'Yes, integration-heavy'},
                {'value': 'optional', 'label': 'Optional'},
                {'value': 'no', 'label': 'No, simple workflow'},
            ],
        },
    ]

    def follow_up_bonus(tool: dict) -> int:
        bonus = 0
        breakdown = tool.get('scoreBreakdown') or {}
        tags = [str(tag).lower() for tag in (tool.get('tags') or [])]
        text = f"{tool.get('name', '')} {tool.get('description', '')} {' '.join(tags)}".lower()

        priority = normalized_answers.get('priority')
        if priority == 'speed':
            bonus += 6 if int(breakdown.get('speed') or tool.get('score') or 0) >= 90 else 2
        elif priority == 'quality':
            bonus += 6 if int(breakdown.get('accuracy') or tool.get('score') or 0) >= 90 else 2
        elif priority == 'ease':
            bonus += 6 if int(breakdown.get('ease') or tool.get('score') or 0) >= 88 else 2
        elif priority == 'cost':
            bonus += 7 if tool.get('pricing_model') in {'free', 'freemium'} else -4

        level = normalized_answers.get('experience_level')
        if level == 'beginner':
            bonus += 4 if int(breakdown.get('ease') or tool.get('score') or 0) >= 85 else 0
        elif level == 'advanced':
            bonus += 4 if any(token in text for token in ['api', 'sdk', 'automation', 'workflow']) else 0

        integration = normalized_answers.get('integration_need')
        has_integrations = any(token in text for token in ['api', 'integration', 'workflow', 'pipeline'])
        if integration == 'yes':
            bonus += 5 if has_integrations else -3
        elif integration == 'no':
            bonus += 3 if not has_integrations else 0

        return bonus

    def score(tool: dict) -> int:
        text = f"{tool.get('name', '')} {tool.get('description', '')} {' '.join(tool.get('tags', []))}".lower()
        keyword_hits = sum(1 for word in words if word in text)
        paid = tool.get('pricing_model') in {'paid', 'enterprise'}
        budget_bonus = 8 if budget == 'free' and not paid else -8 if budget == 'free' and paid else 6 if budget == 'premium' and paid else 0
        return int(tool.get('score', 0)) + keyword_hits * 6 + budget_bonus + follow_up_bonus(tool)

    ranked = sorted(candidates, key=score, reverse=True)[:5]

    enriched_recommendations = []
    for tool in ranked:
        text = f"{tool.get('name', '')} {tool.get('description', '')} {' '.join(tool.get('tags', []))}".lower()
        keyword_hits = sum(1 for word in words if word in text)
        paid = tool.get('pricing_model') in {'paid', 'enterprise'}
        budget_fit = 'strong' if (budget == 'free' and not paid) or (budget == 'premium' and paid) or budget == 'mixed' else 'medium'
        if budget == 'free' and paid:
            budget_fit = 'weak'

        category_match = any(fragment in (tool.get('category', '').lower()) for fragment in inferred_query_categories)
        compatibility_score = min(100, int(tool.get('score', 0)) + keyword_hits * 4 + (8 if category_match else 0) + max(0, follow_up_bonus(tool)))

        reasons = []
        if keyword_hits > 0:
            reasons.append(f'Matches {keyword_hits} requirement keyword(s).')
        if category_match:
            reasons.append('Category aligns with your inferred use case.')
        if tool.get('trending'):
            reasons.append('Currently trending among users.')
        if budget_fit == 'strong':
            reasons.append('Strong budget fit for selected mode.')
        elif budget_fit == 'weak':
            reasons.append('May exceed your selected budget mode.')
        if normalized_answers:
            reasons.append('Adjusted using your follow-up preferences.')

        enriched_recommendations.append(
            {
                **tool,
                'keyword_match_count': keyword_hits,
                'budget_fit': budget_fit,
                'compatibility_score': compatibility_score,
                'reasoning': reasons[:3],
            }
        )

    grouped: dict[str, list[dict]] = {}
    for tool in enriched_recommendations:
        grouped.setdefault(tool.get('category', 'General'), []).append(tool)

    steps = []
    for index, (category_name, tools) in enumerate(grouped.items()):
        if index > 2:
            break
        steps.append(
            {
                'role': 'Primary' if index == 0 else 'Supporting' if index == 1 else 'Optional',
                'categories': [category_name],
                'primary': tools[0] if tools else None,
                'alternative': tools[1] if len(tools) > 1 else None,
            }
        )

    result = {
        'query': query_text,
        'budget': budget,
        'category': category,
        'recommendations': enriched_recommendations,
        'workflow': {
            'budgetMode': budget,
            'template': 'python-agent-ready',
            'steps': steps,
        },
        'rationale': {
            'inferred_query_categories': inferred_query_categories,
            'average_compatibility_score': round(
                sum(tool.get('compatibility_score', 0) for tool in enriched_recommendations) / max(1, len(enriched_recommendations)),
                2,
            ),
            'budget_fit_summary': {
                'strong': len([tool for tool in enriched_recommendations if tool.get('budget_fit') == 'strong']),
                'medium': len([tool for tool in enriched_recommendations if tool.get('budget_fit') == 'medium']),
                'weak': len([tool for tool in enriched_recommendations if tool.get('budget_fit') == 'weak']),
            },
        },
        'follow_up': {
            'questions': follow_up_questions,
            'answers': normalized_answers,
            'is_refined': bool(normalized_answers),
        },
        'generated_at': datetime.utcnow().isoformat() + 'Z',
    }
    set_cached(recommend_cache_key, result, ttl_seconds=120)
    return result
