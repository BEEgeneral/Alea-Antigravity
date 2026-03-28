-- Create table for Pelayo conversation history
CREATE TABLE IF NOT EXISTS pelayo_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pelayo_conversations_user_id ON pelayo_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_pelayo_conversations_created_at ON pelayo_conversations(created_at DESC);

-- RLS
ALTER TABLE pelayo_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can read own conversations" ON pelayo_conversations
FOR SELECT USING (true);

-- Service role can insert
CREATE POLICY "Service role can insert" ON pelayo_conversations
FOR INSERT WITH CHECK (true);

-- Service role can delete
CREATE POLICY "Service role can delete" ON pelayo_conversations
FOR DELETE USING (true);

-- Create table for pending confirmations (preview before create)
CREATE TABLE IF NOT EXISTS pelayo_pending_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('create_property', 'create_investor', 'create_lead', 'create_mandatario')),
    entity_type TEXT NOT NULL,
    data JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- RLS for pending actions
ALTER TABLE pelayo_pending_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pending actions" ON pelayo_pending_actions
FOR SELECT USING (true);

CREATE POLICY "Service role can manage pending actions" ON pelayo_pending_actions
FOR ALL USING (true);

-- Create table for notifications
CREATE TABLE IF NOT EXISTS pelayo_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('opportunity', 'alert', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE pelayo_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON pelayo_notifications
FOR SELECT USING (true);

CREATE POLICY "Users can update own notifications" ON pelayo_notifications
FOR UPDATE USING (true);

CREATE POLICY "Service role can insert notifications" ON pelayo_notifications
FOR INSERT WITH CHECK (true);
