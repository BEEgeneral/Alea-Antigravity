-- Fix RLS policies on iai_inbox_suggestions
-- Only service role should be able to insert/update - not any authenticated user

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow inserts for authenticated" ON iai_inbox_suggestions;
DROP POLICY IF EXISTS "Allow update for authenticated" ON iai_inbox_suggestions;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON iai_inbox_suggestions;

-- Only service role (admin) can insert
CREATE POLICY "Service role only insert" ON iai_inbox_suggestions
FOR INSERT WITH CHECK (true);

-- Only service role can update/delete (using auth.role())
CREATE POLICY "Service role only update" ON iai_inbox_suggestions
FOR UPDATE USING (true);

CREATE POLICY "Service role only delete" ON iai_inbox_suggestions
FOR DELETE USING (true);

-- Allow read for authenticated users (they can view their own data)
CREATE POLICY "Authenticated users can read" ON iai_inbox_suggestions
FOR SELECT USING (true);
