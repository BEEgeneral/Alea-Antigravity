# 🌌 Aleasignature - Luxury Real Estate Platform

Aleasignature is an exclusive, high-end real estate and investment platform designed for high-net-worth individuals and institutional investors. The portal offers a curated selection of off-market properties, dynamic profitability calculators, and a secure operational pipeline for agents.

*Built with Next.js (App Router), Supabase (Auth, Postgres, Edge Functions), Tailwind CSS, and Framer Motion for a "Quiet Luxury" aesthetic.*

## ✨ Features

- **Exclusive Radar de Inversión:** Off-market property listings with secure data rooms.
- **Dynamic Profitability Calculator:** Instant ROI and yield estimations for investors.
- **Agent Dashboard & CRM:** Integrated lead management, interaction logging, and matching system.
- **Data Security:** Strict Row Level Security (RLS) policies implemented via Supabase to protect sensitive property and investor data.
- **Premium UI/UX:** High-performance, kinetic typography, glassmorphism, and seamless micro-interactions.

## 🚀 Getting Started

First, set up your local environment variables. Create a `.env.local` file and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Architecture

- **Frontend:** Next.js 15, React, Tailwind CSS, Framer Motion, Lucide React.
- **Backend/Database:** Supabase (PostgreSQL), Edge Functions for complex calculations.
- **Deployment:** Ready for Vercel.

## 🛡️ Definition of Done (The House Way)
This project follows strict guidelines for speed-to-market, visual excellence, and maintainability.
- **Visuals:** Minimalist, high contrast, avoiding generic defaults.
- **Interactions:** Fast feedback, clear system states (loading, errors, success).
- **Codebase:** Typed, linted, and fully architected for scalability.

---
*Created by [Antigravity]*
