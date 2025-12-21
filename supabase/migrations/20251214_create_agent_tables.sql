-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agent 1: Scraper Data
CREATE TABLE IF NOT EXISTS scraped_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  url TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraped_supplier ON scraped_data(supplier_id);
CREATE INDEX IF NOT EXISTS idx_scraped_type ON scraped_data(data_type);

-- Agent 2: Email Logs
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_supplier ON email_log(supplier_id);
CREATE INDEX IF NOT EXISTS idx_email_type ON email_log(type);

-- Agent 3: Social Posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  posted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_platform ON social_posts(platform);

-- Agent 4: Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  messages JSONB DEFAULT '[]',
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_conversations(user_id);

-- Shared Monitoring: Agent Logs
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_type TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_type ON agent_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_status ON agent_logs(status);
