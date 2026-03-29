CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS agent_tool_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  tool_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tool_events_created_at ON agent_tool_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tool_events_tool_id ON agent_tool_events (tool_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_events_event_type ON agent_tool_events (event_type);
