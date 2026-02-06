// Dashboard API Route
// Protected endpoint - requires authentication
// Returns all dashboard data for authenticated user

import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/services/dashboard/dashboard.service';
import { getCurrentUser } from '@/lib/services/auth/auth.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get authenticated user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all dashboard data
    const data = await getDashboardData(user.userId);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120', // Cache for 1 minute (user-specific)
      },
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);

    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
