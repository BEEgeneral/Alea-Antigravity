import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"

// Edge-compatible Neon driver (lazy — only connects at runtime)
// Uses NEON_* vars that are already configured in Vercel
let _sql: ReturnType<typeof neon> | null = null
function getSql() {
  if (!_sql) {
    const host = process.env.NEON_HOST!
    const port = process.env.NEON_PORT!
    const user = process.env.NEON_USER!
    const password = process.env.NEON_PASSWORD!
    const database = process.env.NEON_DATABASE!
    _sql = neon(`postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`)
  }
  return _sql
}

// ─────────────────────────────────────────────────────────────────
// Password hashing helpers
// ─────────────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─────────────────────────────────────────────────────────────────
// NextAuth v5 config — Credentials (email + password)
// ─────────────────────────────────────────────────────────────────
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rows = await (getSql() as any)`SELECT id, email, name, password_hash, role, is_active, is_approved FROM users WHERE email = ${email.toLowerCase()}`

          if (!rows[0]) return null

          const user = rows[0]

          // Fallback: if no password hash, deny login (user must reset)
          if (!user.password_hash) return null

          const valid = await verifyPassword(password, user.password_hash)
          if (!valid) return null

          // Check if account is active
          if (!user.is_active) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "agent",
            is_active: user.is_active ?? true,
            is_approved: user.is_approved ?? true,
          }
        } catch (err) {
          console.error("Auth error:", err)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role || "agent"
        token.is_active = (user as any).is_active ?? true
        token.is_approved = (user as any).is_approved ?? true
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id as string
        ;(session.user as any).role = token.role || "agent"
        ;(session.user as any).is_active = token.is_active ?? true
        ;(session.user as any).is_approved = token.is_approved ?? true
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl

      // Public routes (no auth required)
      const publicRoutes = [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/invite",
        "/api/auth",
        "/_next",
        "/favicon",
        "/aviso-legal",
        "/cookies",
        "/cumplimiento",
        "/privacidad",
        "/terminos",
      ]
      if (publicRoutes.some((p) => pathname.startsWith(p))) return true

      // Authenticated user on home — redirect by role
      if (pathname === "/" && auth?.user) {
        const role = (auth.user as any)?.role
        if (role === "investor") return Response.redirect(new URL("/radar", nextUrl))
        if (role === "agent" || role === "admin") return Response.redirect(new URL("/praetorium", nextUrl))
        return true
      }

      // /praetorium requires auth — redirect to login
      if (pathname.startsWith("/praetorium")) {
        if (!auth?.user) return Response.redirect(new URL("/login", nextUrl))
        const role = (auth.user as any)?.role
        if (role !== "admin" && role !== "agent") {
          const email = (auth.user as any)?.email?.toLowerCase()
          const isGodMode = email === "beenocode@gmail.com" || email === "albertogala@beenocode.com"
          if (!isGodMode) return Response.redirect(new URL("/login", nextUrl))
        }
        return true
      }

      // All other routes require auth
      if (!auth?.user) return Response.redirect(new URL("/", nextUrl))
      return true
    },
  },
  session: { strategy: "jwt" },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
