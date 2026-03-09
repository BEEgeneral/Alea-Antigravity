-- Migration to approve albertogala@beenocode.com as an agent
-- This will ensure they are in the agents table and marked as approved

INSERT INTO agents (email, full_name, role, is_approved)
VALUES ('albertogala@beenocode.com', 'Alberto Gala', 'admin', true)
ON CONFLICT (email) DO UPDATE 
SET is_approved = true, role = 'admin';
