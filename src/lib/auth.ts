import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { Pool } from "pg"
import type { NextAuthConfig } from "next-auth"

// ─────────────────────────────────────────────────────────
// Neon PostgreSQL connection pool
// ─────────────────────────────────────────────────────────
const neonPool = new Pool({
  host: process.env.NEON_HOST || "ep-plain-fog-al6rviiz-pooler.c-3.eu-central-1.aws.neon.tech",
  port: parseInt(process.env.NEON_PORT || "5432", 10),
  user: process.env.NEON_USER || "neondb_owner",
  password: process.env.NEON_PASSWORD,
  database: process.env.NEON_DATABASE || "neondb",
  ssl: { rejectUnauthorized: false },
  max: 5,
})

// ─────────────────────────────────────────────────────────
// NextAuth v5 config — Magic Link via Resend (JWT sessions)
// ─────────────────────────────────────────────────────────
export const authConfig: NextAuthConfig = {
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "Alea Signature <noreply@aleasignature.com>",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verified=1",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.email = user.email
        token.name = user.name
        // Fetch role from Neon users table
        if (user.email) {
          try {
            const { rows } = await neonPool.query(
              "SELECT role, is_active, is_approved FROM users WHERE email = $1",
              [user.email]
            )
            if (rows[0]) {
              token.role = rows[0].role
              token.is_active = rows[0].is_active
              token.is_approved = rows[0].is_approved
            } else {
              token.role = "agent"
              token.is_active = true
              token.is_approved = false
            }
          } catch {
            token.role = "agent"
            token.is_active = true
            token.is_approved = false
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role || "agent"
        ;(session.user as any).is_active = token.is_active ?? true
        ;(session.user as any).is_approved = token.is_approved ?? false
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnProtected = !["/login", "/register", "/forgot-password", "/api/auth", "/_next", "/favicon"].some(
        (p) => nextUrl.pathname.startsWith(p)
      )
      if (isOnProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl))
      }
      return true
    },
  },
  session: { strategy: "jwt" },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
