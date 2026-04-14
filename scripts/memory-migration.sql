-- Alea Memory System - MemPalace-inspired architecture on InsForge
-- Wings → Rooms → Drawers (verbatim storage)

-- Memory Wings: Each investor, property, or project gets a wing
CREATE TABLE IF NOT EXISTS memory_wings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,           -- e.g., 'investor_alberto_gala', 'property_palacio_gran_via'
    wing_type TEXT NOT NULL,             -- 'investor', 'property', 'project', 'session'
    entity_id UUID,                       -- FK to investor/property if applicable
    description TEXT,
    keywords TEXT[],                      -- For auto-discovery
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Rooms: Specific topics within a wing
-- hall_facts: decisions made, choices locked in
-- hall_events: sessions, milestones, debugging  
-- hall_discoveries: breakthroughs, new insights
-- hall_preferences: habits, likes, opinions
-- hall_advice: recommendations and solutions
CREATE TABLE IF NOT EXISTS memory_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wing_id UUID NOT NULL REFERENCES memory_wings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                  -- e.g., 'auth-migration', 'budget-preferences'
    hall_type TEXT NOT NULL,              -- 'facts', 'events', 'discoveries', 'preferences', 'advice'
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wing_id, name)
);

-- Memory Drawers: Verbatim content storage (like MemPalace raw mode)
CREATE TABLE IF NOT EXISTS memory_drawers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES memory_rooms(id) ON DELETE CASCADE,
    content TEXT NOT NULL,                -- Verbatim content (no summarization)
    content_type TEXT DEFAULT 'text',     -- 'text', 'decision', 'quote', 'code', 'event'
    source TEXT,                          -- Where this came from: 'pelayo_chat', 'centurion', 'manual'
    source_id UUID,                       -- Reference to original entity (chat message id, etc.)
    metadata JSONB DEFAULT '{}',
    importance_score INTEGER DEFAULT 50,  -- 0-100, for filtering
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Graph: Temporal entity-relationship triples
CREATE TABLE IF NOT EXISTS memory_knowledge_graph (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_subject TEXT NOT NULL,        -- e.g., 'Alberto Gala'
    relationship TEXT NOT NULL,          -- e.g., 'works_on', 'prefers', 'decided'
    entity_object TEXT NOT NULL,          -- e.g., 'Palacio Gran Vía'
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,             -- NULL = still true
    confidence_score INTEGER DEFAULT 100,
    source TEXT,                          -- 'pelayo', 'centurion', 'manual'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_wings_entity ON memory_wings(entity_id);
CREATE INDEX IF NOT EXISTS idx_wings_type ON memory_wings(wing_type);
CREATE INDEX IF NOT EXISTS idx_rooms_wing ON memory_rooms(wing_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hall ON memory_rooms(hall_type);
CREATE INDEX IF NOT EXISTS idx_drawers_room ON memory_drawers(room_id);
CREATE INDEX IF NOT EXISTS idx_drawers_created ON memory_drawers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kg_subject ON memory_knowledge_graph(entity_subject);
CREATE INDEX IF NOT EXISTS idx_kg_relationship ON memory_knowledge_graph(relationship);
CREATE INDEX IF NOT EXISTS idx_kg_valid ON memory_knowledge_graph(valid_from, valid_until);

-- RLS Policies
ALTER TABLE memory_wings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_drawers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_knowledge_graph ENABLE ROW LEVEL SECURITY;

-- Everyone with auth can read
CREATE POLICY "memory_wings_select" ON memory_wings FOR SELECT USING (true);
CREATE POLICY "memory_rooms_select" ON memory_rooms FOR SELECT USING (true);
CREATE POLICY "memory_drawers_select" ON memory_drawers FOR SELECT USING (true);
CREATE POLICY "memory_kg_select" ON memory_knowledge_graph FOR SELECT USING (true);

-- Only agents/admins can write
CREATE POLICY "memory_wings_admin" ON memory_wings FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);
CREATE POLICY "memory_rooms_admin" ON memory_rooms FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);
CREATE POLICY "memory_drawers_admin" ON memory_drawers FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);
CREATE POLICY "memory_kg_admin" ON memory_knowledge_graph FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);

-- Function to auto-create wing for investor
CREATE OR REPLACE FUNCTION ensure_investor_wing(investor_id UUID)
RETURNS UUID AS $$
DECLARE
    wing_id UUID;
    investor_email TEXT;
BEGIN
    SELECT email INTO investor_email FROM investors WHERE id = investor_id;
    
    INSERT INTO memory_wings (name, wing_type, entity_id, keywords)
    VALUES (
        'investor_' || COALESCE(investor_email, investor_id::TEXT),
        'investor',
        investor_id,
        ARRAY['investor', 'preferences', 'history']
    )
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO wing_id;
    
    RETURN wing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create wing for property
CREATE OR REPLACE FUNCTION ensure_property_wing(property_id UUID)
RETURNS UUID AS $$
DECLARE
    wing_id UUID;
    property_title TEXT;
BEGIN
    SELECT title INTO property_title FROM properties WHERE id = property_id;
    
    INSERT INTO memory_wings (name, wing_type, entity_id, keywords)
    VALUES (
        'property_' || COALESCE(REPLACE(LOWER(property_title), ' ', '_'), property_id::TEXT),
        'property',
        property_id,
        ARRAY['property', 'asset', 'details']
    )
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO wing_id;
    
    RETURN wing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add memory drawer with room auto-creation
CREATE OR REPLACE FUNCTION add_memory_drawer(
    p_wing_name TEXT,
    p_room_name TEXT,
    p_hall_type TEXT,
    p_content TEXT,
    p_source TEXT DEFAULT 'manual',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    wing_rec RECORD;
    room_id UUID;
    drawer_id UUID;
BEGIN
    -- Get or create wing
    SELECT id INTO wing_rec FROM memory_wings WHERE name = p_wing_name;
    IF NOT FOUND THEN
        INSERT INTO memory_wings (name, wing_type, keywords)
        VALUES (p_wing_name, 'general', ARRAY['general'])
        RETURNING id INTO wing_rec;
    END IF;
    
    -- Get or create room
    SELECT id INTO room_id FROM memory_rooms 
    WHERE wing_id = wing_rec.id AND name = p_room_name;
    IF NOT FOUND THEN
        INSERT INTO memory_rooms (wing_id, name, hall_type)
        VALUES (wing_rec.id, p_room_name, p_hall_type)
        RETURNING id INTO room_id;
    END IF;
    
    -- Insert drawer
    INSERT INTO memory_drawers (room_id, content, source, metadata)
    VALUES (room_id, p_content, p_source, p_metadata)
    RETURNING id INTO drawer_id;
    
    RETURN drawer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get memory context for AI
CREATE OR REPLACE FUNCTION get_memory_context(
    p_wing_name TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    hall_type TEXT,
    room_name TEXT,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.hall_type, r.name as room_name, d.content, d.created_at
    FROM memory_drawers d
    JOIN memory_rooms r ON d.room_id = r.id
    JOIN memory_wings w ON r.wing_id = w.id
    WHERE w.name = p_wing_name
    ORDER BY d.importance_score DESC, d.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE memory_wings IS 'Wings in the Palace - each investor/property/project gets a wing';
COMMENT ON TABLE memory_rooms IS 'Rooms within wings - specific topics (auth, budget, preferences)';
COMMENT ON TABLE memory_drawers IS 'Verbatim content storage - no summarization, raw memory';
COMMENT ON TABLE memory_knowledge_graph IS 'Temporal entity-relationship triples';
