import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { neon } from "@neondatabase/serverless"
import type { NextAuthConfig } from "next-auth"

// ─────────────────────────────────────────────────────────
// Neon HTTP serverless driver (Edge Runtime compatible)
// ─────────────────────────────────────────────────────────
const sql = neon(process.env.DATABASE_URL!)

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
            const rows = await sql`SELECT role, is_active, is_approved FROM users WHERE email = ${user.email}`
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
      const { pathname } = nextUrl

      // Rutas públicas sin auth
      const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/api/auth", "/_next", "/favicon", "/aviso-legal", "/cookies", "/cumplimiento", "/privacidad", "/terminos"]
      if (publicRoutes.some((p) => pathname.startsWith(p))) return true

      // User autenticado — redirigir según rol desde la home
      if (pathname === "/" && auth?.user) {
        const role = (auth.user as any)?.role
        if (role === "investor") return Response.redirect(new URL("/radar", nextUrl))
        if (role === "agent" || role === "admin") return Response.redirect(new URL("/praetorium", nextUrl))
        return true
      }

      // /praetorium requiere auth — redirigir a login directamente
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

      // Todo lo demás requiere auth — redirect a home
      if (!auth?.user) return Response.redirect(new URL("/", nextUrl))
      return true
    },
  },
  session: { strategy: "jwt" },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
