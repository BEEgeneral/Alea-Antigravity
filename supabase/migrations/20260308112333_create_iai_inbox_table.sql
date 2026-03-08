CREATE TABLE IF NOT EXISTS iai_inbox_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_email_subject TEXT,
    original_email_body TEXT,
    sender_email TEXT,
    suggestion_type TEXT,
    extracted_data JSONB,
    ai_interpretation TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE iai_inbox_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage suggestions"
ON iai_inbox_suggestions FOR ALL
TO authenticated
USING (is_approved_agent());
