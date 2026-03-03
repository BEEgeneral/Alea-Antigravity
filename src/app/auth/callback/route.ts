import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/radar'

    if (code) {
        const supabase = await createSupabaseServerClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            const userEmail = data.user.email;

            // For the Super Admin, always go to Praetorium
            const finalDestination = userEmail === 'beenocode@gmail.com'
                ? '/praetorium'
                : next;

            console.log(`Auth Success: Redirecting ${userEmail} to ${finalDestination}`);
            return NextResponse.redirect(`${origin}${finalDestination}`)
        } else {
            console.error("Auth callback exchange error:", error)
        }
    }

    // Return to origin if no code or error
    return NextResponse.redirect(`${origin}/login?error=Invalid%20or%20expired%20magic%20link`)
}
