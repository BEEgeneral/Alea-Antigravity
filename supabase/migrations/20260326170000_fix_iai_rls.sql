-- Fix RLS for IAI inbox to allow API inserts
DROP POLICY IF EXISTS "Agents can manage suggestions" ON iai_inbox_suggestions;

-- Allow any authenticated user to insert
CREATE POLICY "Allow inserts for authenticated"
ON iai_inbox_suggestions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to select
CREATE POLICY "Allow select for authenticated"
ON iai_inbox_suggestions FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update
CREATE POLICY "Allow update for authenticated"
ON iai_inbox_suggestions FOR UPDATE
TO authenticated
USING (true);
