
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testMagicLink(email: string) {
  console.log(`Testing Magic Link for: ${email}`)
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: 'http://localhost:3000/auth/callback'
    }
  })

  if (error) {
    console.error('Error:', error.message)
    console.error('Status:', error.status)
  } else {
    console.log('Success! Email sent (theoretically). Data:', data)
  }
}

testMagicLink('beenocode@gmail.com')
