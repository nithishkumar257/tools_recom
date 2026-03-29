#!/usr/bin/env python3
"""
Generate Python code for a comprehensive fallback tools list.
"""

import json
import random

# Generate realistic AI tools data
AI_TOOLS = [
    # Coding & Development
    ("GitHub Copilot", "github-copilot", "Coding", "AI pair programmer for code suggestions and chat", "https://github.com/features/copilot", 97, "Microsoft/GitHub"),
    ("Codeium", "codeium", "Coding", "Free AI coding assistant with broad language support", "https://codeium.com", 85, "Exafunction"),
    ("Tabnine", "tabnine", "Coding", "AI code completion powered by deep learning", "https://www.tabnine.com", 84, "Tabnine"),
    ("Claude", "claude", "Coding", "Advanced AI assistant for coding and analysis", "https://claude.ai", 96, "Anthropic"),
    ("Codex", "codex", "Coding", "OpenAI's code generation model", "https://openai.com/codex", 89, "OpenAI"),
    ("Replit Ghostwriter", "replit-ghostwriter", "Coding", "AI coding assistant in Replit IDE", "https://replit.com", 82, "Replit"),
    ("Amazon CodeWhisperer", "amazon-codewhisperer", "Coding", "ML-powered code suggestions by AWS", "https://aws.amazon.com/codewhisperer", 83, "Amazon"),
    ("Perplexity AI", "perplexity-ai", "Coding", "AI assistant for research and coding", "https://perplexity.ai", 88, "Perplexity"),
    
    # Writing & Content
    ("ChatGPT", "chatgpt", "Writing", "Advanced general-purpose AI assistant", "https://chatgpt.com", 98, "OpenAI"),
    ("Jasper", "jasper", "Writing", "AI content writer for marketers", "https://www.jasper.ai", 87, "Jasper"),
    ("Copy.ai", "copy-ai", "Writing", "AI copywriting tool for marketing", "https://www.copy.ai", 84, "Copy.ai"),
    ("Writersonic", "writersonic", "Writing", "AI writer for content creation", "https://writersonic.com", 83, "Writersonic"),
    ("Grammarly", "grammarly", "Writing", "AI-powered writing assistant", "https://www.grammarly.com", 92, "Grammarly"),
    ("Hemingway Editor", "hemingway-editor", "Writing", "App to improve writing clarity", "https://www.hemingwayapp.com", 80, "Hemingway"),
    ("Quillbot", "quillbot", "Writing", "AI paraphrasing and writing tool", "https://quillbot.com", 85, "QuillBot"),
    ("ProWritingAid", "prowritingaid", "Writing", "Writing analysis and improvement tool", "https://www.prowritingaid.com", 88, "ProWritingAid"),
    ("Sudowrite", "sudowrite", "Writing", "AI writing assistant for creative writers", "https://www.sudowrite.com", 86, "Sudowrite"),
    
    # Design & Image Generation
    ("Midjourney", "midjourney", "Design", "AI image generator for creative prompts", "https://www.midjourney.com", 94, "Midjourney"),
    ("DALL-E", "dall-e", "Design", "OpenAI's AI image generation model", "https://openai.com/dall-e-3", 93, "OpenAI"),
    ("Stable Diffusion", "stable-diffusion", "Design", "Open-source AI image generation", "https://stability.ai", 91, "Stability AI"),
    ("Adobe Firefly", "adobe-firefly", "Design", "AI generative features in Adobe products", "https://www.adobe.com/firefly", 89, "Adobe"),
    ("Canva AI", "canva-ai", "Design", "AI-powered design suggestions in Canva", "https://www.canva.com", 86, "Canva"),
    ("Figma AI", "figma-ai", "Design", "AI design tools in Figma", "https://www.figma.com", 87, "Figma"),
    ("Runway", "runway", "Design", "AI video and image generation platform", "https://www.runway.com", 88, "Runway ML"),
    ("Synthesia", "synthesia", "Design", "AI video generation from text", "https://www.synthesia.io", 85, "Synthesia"),
    ("D-ID", "d-id", "Design", "AI video generation with digital avatars", "https://www.d-id.com", 83, "D-ID"),
    
    # Automation & Workflow  
    ("Zapier", "zapier", "Automation", "Workflow automation and integrations", "https://zapier.com", 90, "Zapier"),
    ("n8n", "n8n", "Automation", "Open-source workflow automation platform", "https://n8n.io", 88, "n8n"),
    ("Make (Integromat)", "make", "Automation", "Cloud automation and workflow platform", "https://www.make.com", 87, "Make"),
    ("IFTTT", "ifttt", "Automation", "If This Then That automation service", "https://ifttt.com", 82, "IFTTT"),
    ("Automation Anywhere", "automation-anywhere", "Automation", "Enterprise RPA platform", "https://www.automationanywhere.com", 85, "Automation Anywhere"),
    ("UiPath", "uipath", "Automation", "Enterprise robotic process automation", "https://www.uipath.com", 86, "UiPath"),
    ("Assistant", "assistant", "Automation", "AI automation assistant for repetitive tasks", "https://example.com", 80, "Various"),
    
    # Business & Analytics
    ("Power BI", "power-bi", "Business", "Business analytics and data visualization", "https://powerbi.microsoft.com", 89, "Microsoft"),
    ("Tableau", "tableau", "Business", "Data visualization and analytics platform", "https://www.tableau.com", 90, "Salesforce"),
    ("Looker", "looker", "Business", "Business intelligence and analytics", "https://www.looker.com", 88, "Google"),
    ("Alteryx", "alteryx", "Business", "Data analytics and automation platform", "https://www.alteryx.com", 85, "Alteryx"),
    ("Qlik", "qlik", "Business", "Data analytics and visualization platform", "https://www.qlik.com", 86, "Qlik"),
    ("Scale AI", "scale-ai", "Business", "Data labeling and quality for AI", "https://www.scale.com", 87, "Scale AI"),
    
    # Research & Knowledge
    ("Consensus", "consensus", "Research", "AI research paper search engine", "https://consensus.app", 84, "Consensus"),
    ("Semantic Scholar", "semantic-scholar", "Research", "AI-powered academic paper search", "https://www.semanticscholar.org", 86, "Allen AI"),
    ("Scholarcy", "scholarcy", "Research", "AI summarization of research papers", "https://www.scholarcy.com", 82, "Scholarcy"),
    ("PapersWithCode", "paperswithcode", "Research", "ML research papers with code", "https://www.paperswithcode.com", 88, "Meta"),
    ("Dimensions", "dimensions", "Research", "Research analytics and discovery platform", "https://www.dimensions.ai", 85, "Dimensions"),
    
    # Voice & Audio
    ("ElevenLabs", "elevenlabs", "Voice", "AI voice generation and synthesis", "https://elevenlabs.io", 91, "ElevenLabs"),
    ("Descript", "descript", "Voice", "Video and audio editing with AI", "https://www.descript.com", 88, "Descript"),
    ("Otter.ai", "otter-ai", "Voice", "AI transcription and meeting notes", "https://otter.ai", 86, "Otter"),
    ("Fireflies.ai", "fireflies-ai", "Voice", "AI meeting recording and transcription", "https://fireflies.ai", 84, "Fireflies"),
    ("Rev", "rev", "Voice", "Professional transcription services", "https://www.rev.com", 83, "Rev"),
    ("Murf AI", "murf-ai", "Voice", "Text-to-speech with AI voices", "https://murf.ai", 85, "Murf"),
    ("Google Cloud Speech", "google-cloud-speech", "Voice", "Google's speech recognition API", "https://cloud.google.com/speech-to-text", 89, "Google"),
    
    # Video & Multimedia
    ("Fliki", "fliki", "Design", "AI video creation from text and images", "https://fliki.ai", 83, "Fliki"),
    ("Pictory", "pictory", "Design", "AI video generation from scripts", "https://www.pictory.ai", 82, "Pictory"),
    ("HeyGen", "heygen", "Design", "AI video generator with avatars", "https://www.heygen.com", 84, "HeyGen"),
    ("OpusClip", "opusclip", "Design", "AI short-form video creation", "https://opusclip.com", 81, "OpusClip"),
    ("Runway Gen-2", "runway-gen2", "Design", "AI video generation model", "https://www.runway.com", 87, "Runway"),
    
    # Customer Service & Support
    ("Intercom", "intercom", "Business", "Customer communication platform with AI", "https://www.intercom.com", 85, "Intercom"),
    ("Drift", "drift", "Business", "Conversational marketing platform", "https://www.drift.com", 83, "Drift"),
    ("Zendesk", "zendesk", "Business", "Customer service platform with AI", "https://www.zendesk.com", 84, "Zendesk"),
    ("Freshdesk", "freshdesk", "Business", "Cloud-based support ticket system", "https://freshdesk.com", 82, "Freshworks"),
    ("Helpscout", "helpscout", "Business", "Help desk software with AI", "https://www.helpscout.com", 81, "Help Scout"),
    
    # Marketing & Social
    ("Buffer", "buffer", "Business", "Social media scheduling with AI insights", "https://buffer.com", 83, "Buffer"),
    ("Hootsuite", "hootsuite", "Business", "Social media management platform", "https://hootsuite.com", 84, "Hootsuite"),
    ("Sprout Social", "sprout-social", "Business", "Social media management and analytics", "https://sproutsocial.com", 85, "Sprout Social"),
    ("Later", "later", "Business", "Instagram marketing and scheduling", "https://www.later.com", 82, "Later"),
    ("Semrush", "semrush", "Business", "SEO and content marketing platform", "https://semrush.com", 86, "Semrush"),
    
    # Productivity & Note-taking
    ("Notion AI", "notion-ai", "Business", "AI features in Notion workspace", "https://www.notion.so", 84, "Notion"),
    ("Obsidian Copilot", "obsidian-copilot", "Business", "AI assistant for Obsidian notes", "https://obsidian.md", 81, "Obsidian"),
    ("Roam Research", "roam-research", "Business", "Connected notes system with AI", "https://roamresearch.com", 80, "Roam"),
    ("Microsoft Copilot in Microsoft 365", "ms-copilot-365", "Business", "AI assistant integrated in MS Office", "https://www.microsoft.com", 88, "Microsoft"),
    ("Google Workspace AI", "google-workspace-ai", "Business", "AI features in Google Workspace", "https://workspace.google.com", 86, "Google"),
    
    # E-commerce & Product
    ("Relatable", "relatable", "Business", "AI product recommendation engine", "https://relatable.ai", 79, "Relatable"),
    ("Algopix", "algopix", "Business", "Amazon seller analytics with AI", "https://www.algopix.com", 81, "Algopix"),
    ("Keepa", "keepa", "Business", "Amazon price tracking and analytics", "https://keepa.com", 82, "Keepa"),
    
    # Learning & Education
    ("Khan Academy", "khan-academy", "Research", "Learning platform with AI personalization", "https://www.khanacademy.org", 85, "Khan Academy"),
    ("Duolingo Max", "duolingo-max", "Research", "Language learning with AI", "https://www.duolingo.com", 83, "Duolingo"),
    ("Squirrel AI", "squirrel-ai", "Research", "Adaptive learning platform", "https://www.squirrelai.com", 82, "Squirrel AI"),
    ("Coursera", "coursera", "Research", "Online learning platform with AI", "https://www.coursera.org", 84, "Coursera"),
    
    # HR & Recruitment
    ("HireAbility", "hireability", "Business", "AI recruitment and hiring platform", "https://www.hireability.ai", 80, "HireAbility"),
    ("Workable", "workable", "Business", "Recruitment software with AI", "https://www.workable.com", 83, "Workable"),
    ("Interviewer", "interviewer", "Business", "AI video interviewing platform", "https://www.interviewer.ai", 79, "Interviewer"),
    
    # Developer Tools
    ("GitHub Copilot X", "github-copilot-x", "Coding", "Advanced version of GitHub Copilot", "https://github.com/features/copilot", 96, "GitHub"),
    ("Enzyme", "enzyme", "Coding", "AI code review and quality tool", "https://getenzyme.com", 83, "Enzyme"),
    ("Kolkoda", "kolkoda", "Coding", "AI-powered code sharing platform", "https://kolkoda.ai", 78, "Kolkoda"),
]

# Create Python dictionary representation
py_code = "FALLBACK_TOOLS = [\n"

for i, (name, id_slug, category, desc, url, score, company) in enumerate(AI_TOOLS[:120]):  # First 120 tools
    tags = ["ai", category.lower()]
    if category == "Coding":
        tags.extend(["code", "development", "programming"])
    elif category == "Writing":
        tags.extend(["writing", "content", "marketing"])
    elif category == "Design":
        tags.extend(["design", "image", "creative", "generation"])
    elif category == "Automation":
        tags.extend(["automation", "workflow", "integration"])
    elif category == "Business":
        tags.extend(["business", "analytics", "productivity"])
    elif category == "Research":
        tags.extend(["research", "learning", "education"])
    elif category == "Voice":
        tags.extend(["voice", "audio", "speech", "transcription"])
    
    trending = random.choice([True] * 3 + [False] * 2)
    
    py_code += f"""    {{
        'id': '{id_slug}',
        'name': '{name}',
        'category': '{category}',
        'description': '{desc}',
        'url': '{url}',
        'pricing': 'Free + Paid',
        'score': {score},
        'developer': '{company}',
        'trending': {str(trending)},
        'tags': {tags},
        'features': ['Feature 1', 'Feature 2', 'Feature 3'],
        'pros': ['Pro 1', 'Pro 2'],
        'cons': ['Con 1'],
        'lastUpdated': '2026-03-01',
        'userBase': '10K+ users',
        'scoreBreakdown': {{'accuracy': {score-5}, 'speed': {score-2}, 'ease': {score}, 'value': {score-3}}},
    }},
"""

py_code += "]\n"

with open('fallback_tools_code.py', 'w') as f:
    f.write(py_code)

print(f"✓ Generated {len(AI_TOOLS[:120])} tools in fallback_tools_code.py")
