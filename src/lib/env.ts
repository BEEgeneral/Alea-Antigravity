/**
 * Environment Variables Utility
 * Centralizes access to Vercel System Variables and Project Custom Variables.
 */

export const env = {
  // --- Vercel System Variables (Automatically populated by Vercel) ---
  
  /** The environment the app is running in: 'production', 'preview', or 'development' */
  VERCEL_ENV: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  
  /** The deployment URL (e.g., project-name-git-branch-team.vercel.app) */
  VERCEL_URL: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000',
  
  /** The project's production domain */
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
  
  /** Git branch of the commit */
  VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF,
  
  /** Git SHA of the commit */
  VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  /** Git Provider (github, gitlab, bitbucket) */
  VERCEL_GIT_PROVIDER: process.env.VERCEL_GIT_PROVIDER || process.env.NEXT_PUBLIC_VERCEL_GIT_PROVIDER,

  // --- Project Specific Variables (Custom) ---

  /** Supabase Project URL */
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  
  /** Supabase Anon Key */
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  /** Supabase Service Role Key (Server side ONLY - never expose to client) */
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  /** Gemini API Key (Server side only) */
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  /** Webhook secret for verification */
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,

  /** Comma-separated admin emails for God Mode (super admin bypass) */
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean),

  /** Resend API Key for sending emails */
  RESEND_API_KEY: process.env.RESEND_API_KEY,

  /** Default from email for outgoing emails */
  EMAIL_FROM: process.env.EMAIL_FROM || 'Alea Signature <noreply@aleasignature.com>',

  // --- Helper Methods ---

  /** Returns true if running in Production */
  isProduction: () => (process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV) === 'production',
  
  /** Returns true if running in Preview/Staging */
  isPreview: () => (process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV) === 'preview',
  
  /** Returns true if running in Local Development */
  isDevelopment: () => (process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV) === 'development' || !process.env.VERCEL_ENV,

  /** 
   * Formats the deployment URL with the correct protocol 
   */
  getDeploymentUrl: () => {
    const url = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000';
    return url.startsWith('http') ? url : `https://${url}`;
  }
};

/**
 * Validation function to ensure critical variables are present.
 * Useful for debugging deployment issues.
 */
export const validateEnv = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[env] Critical environment variables are missing: ${missing.join(', ')}`);
    return false;
  }

  return true;
};
