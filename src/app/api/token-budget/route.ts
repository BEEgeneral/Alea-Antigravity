/**
 * API: /api/token-budget
 * GET — Get budget status for current user
 * GET /api/token-budget/report — Get spend report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserBudget, checkBudget, getSpendReport, estimateTokens } from '@/lib/token-budget';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function GET(req: NextRequest) {
  try {
    const client = await createAuthenticatedClient(req);
    const { data: authData } = await client.auth.getCurrentUser();

    if (!authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'status';
    const userId = authData.user.id;

    // Get user role from user_profiles
    const { data: profile } = await client
      .database
      .from('user_profiles')
      .select('role')
      .eq('auth_user_id', userId)
      .single();

    const role = profile?.role || 'agent';

    if (action === 'report') {
      const days = parseInt(searchParams.get('days') || '30');
      const report = await getSpendReport(userId, days);
      return NextResponse.json(report);
    }

    // Default: return current budget status
    const budget = await getUserBudget(userId, role);
    const estimatedCurrentRequest = estimateTokens(searchParams.get('message') || '');
    const check = await checkBudget(userId, role, estimatedCurrentRequest);

    return NextResponse.json({
      budget,
      canProceed: check.allowed,
      ...(check.warning && { warning: check.warning }),
      ...(check.reason && { reason: check.reason }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
