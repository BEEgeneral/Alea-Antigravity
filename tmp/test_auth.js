
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser for .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMagicLink(email) {
  console.log(`Testing Magic Link for: ${email}`);
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: 'http://localhost:3000/auth/callback'
    }
  });

  if (error) {
    console.error('--- ERROR DETECTED ---');
    console.error('Message:', error.message);
    console.error('Status:', error.status);
    console.error('Full Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('--- SUCCESS ---');
    console.log('Supabase accepted the request. Email should be in transit.');
    console.log('Check your SPAM folder and Supabase Auth Logs.');
  }
}

testMagicLink('beenocode@gmail.com');
