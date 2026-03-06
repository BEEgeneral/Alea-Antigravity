-- Add AI interpretation column for email analysis caching
ALTER TABLE iai_inbox_suggestions
ADD COLUMN IF NOT EXISTS ai_interpretation TEXT DEFAULT NULL;
