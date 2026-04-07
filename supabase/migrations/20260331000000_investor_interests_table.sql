-- Table to track investor interests in properties
-- This enables agents to know when an investor is interested in certain properties

CREATE TABLE IF NOT EXISTS investor_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    -- If no property_id, it's a filter-based interest
    filter_criteria JSONB, -- { asset_types: [], locations: [], min_ticket: 0, max_ticket: 0 }
    interest_type TEXT NOT NULL CHECK (interest_type IN ('property_view', 'filter_search', 'contact_request')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'contacted', 'converted', 'expired')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investor_interests_investor ON investor_interests(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_interests_property ON investor_interests(property_id);
CREATE INDEX IF NOT EXISTS idx_investor_interests_status ON investor_interests(status);
CREATE INDEX IF NOT EXISTS idx_investor_interests_created ON investor_interests(created_at DESC);

-- RLS Policies
ALTER TABLE investor_interests ENABLE ROW LEVEL SECURITY;

-- Agents and admins can see all interests
CREATE POLICY "Agents can view all interests"
ON investor_interests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM agents 
        WHERE agents.id = auth.uid() 
        AND (agents.is_approved = true OR agents.role = 'admin')
    )
);

-- Investors can only see their own interests
CREATE POLICY "Investors can view own interests"
ON investor_interests FOR SELECT
TO authenticated
USING (investor_id IN (SELECT id FROM investors WHERE email = auth.jwt()->>'email'));

-- System can insert interests (for tracking)
CREATE POLICY "Authenticated can insert interests"
ON investor_interests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Agents can update status
CREATE POLICY "Agents can update interest status"
ON investor_interests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM agents 
        WHERE agents.id = auth.uid() 
        AND (agents.is_approved = true OR agents.role = 'admin')
    )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investor_interests_updated_at
    BEFORE UPDATE ON investor_interests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
