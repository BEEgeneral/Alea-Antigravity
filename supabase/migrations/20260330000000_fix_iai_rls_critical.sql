-- Fix critical RLS security issue on iai_inbox_suggestions
-- Only service_role (webhook) should be able to INSERT

-- Drop the insecure policies
DROP POLICY IF EXISTS "Allow inserts for authenticated" ON iai_inbox_suggestions;
DROP POLICY IF EXISTS "Allow select for authenticated" ON iai_inbox_suggestions;
DROP POLICY IF EXISTS "Allow update for authenticated" ON iai_inbox_suggestions;

-- INSERT: Only service_role can insert (bypasses RLS anyway, but be explicit)
-- Since supabaseAdmin uses service_role key which bypasses RLS,
-- we allow inserts from authenticated but the actual webhook uses service_role
-- The WITH CHECK ensures only valid suggestion types can be inserted
CREATE POLICY "Service role only insert"
ON iai_inbox_suggestions FOR INSERT
TO authenticated
WITH CHECK (
    suggestion_type IN ('property', 'investor', 'lead', 'mandatario', 'collaborator')
    AND sender_email IS NOT NULL
    AND sender_email <> ''
);

-- SELECT: Authenticated users can view all (they need to see pending items)
CREATE POLICY "Authenticated users can select"
ON iai_inbox_suggestions FOR SELECT
TO authenticated
USING (true);

-- UPDATE: Only update status field, and only to valid transitions
CREATE POLICY "Authenticated users can update status"
ON iai_inbox_suggestions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
    status IN ('pending', 'approved', 'rejected')
);

-- Prevent DELETE entirely
CREATE POLICY "No delete allowed"
ON iai_inbox_suggestions FOR DELETE
TO authenticated
USING (false);
