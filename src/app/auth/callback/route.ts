import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { env } from '@/lib/env'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirection URL after logging in
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createSupabaseServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            const userRole = user?.user_metadata?.role
            const userEmail = user?.email?.toLowerCase()
            const isGodMode = env.ADMIN_EMAILS.includes(userEmail || '')

            let finalNext = next
            // If try to go to /praetorium but not authorized, force /radar
            if (next.startsWith('/praetorium')) {
                if (!isGodMode && userRole !== 'admin' && userRole !== 'agent') {
                    finalNext = '/radar'
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original host before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${finalNext}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${finalNext}`)
            } else {
                return NextResponse.redirect(`${origin}${finalNext}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
