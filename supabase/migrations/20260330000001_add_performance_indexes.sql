-- Add missing indexes for performance optimization
-- Run this in Supabase SQL Editor

-- Indexes for common queries on leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_investor_id ON leads(investor_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_is_published ON properties(is_published);
CREATE INDEX IF NOT EXISTS idx_properties_is_off_market ON properties(is_off_market);
CREATE INDEX IF NOT EXISTS idx_properties_asset_type ON properties(asset_type);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- Indexes for investors
CREATE INDEX IF NOT EXISTS idx_investors_is_verified ON investors(is_verified);
CREATE INDEX IF NOT EXISTS idx_investors_email ON investors(email);
CREATE INDEX IF NOT EXISTS idx_investors_created_at ON investors(created_at DESC);

-- Indexes for IAI inbox suggestions
CREATE INDEX IF NOT EXISTS idx_iai_inbox_status ON iai_inbox_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_iai_inbox_type ON iai_inbox_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_iai_inbox_created_at ON iai_inbox_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iai_inbox_sender ON iai_inbox_suggestions(sender_email);

-- Indexes for Pelayo conversations and notifications
CREATE INDEX IF NOT EXISTS idx_pelayo_conversations_user_id ON pelayo_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_pelayo_conversations_created_at ON pelayo_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pelayo_pending_actions_user_id ON pelayo_pending_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_pelayo_pending_actions_status ON pelayo_pending_actions(status);
CREATE INDEX IF NOT EXISTS idx_pelayo_notifications_user_id ON pelayo_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_pelayo_notifications_read ON pelayo_notifications(read);

-- Indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_investor_id ON activity_logs(investor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_property_id ON activity_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_published_status ON properties(is_published, status);
CREATE INDEX IF NOT EXISTS idx_iai_inbox_status_type ON iai_inbox_suggestions(status, suggestion_type);
