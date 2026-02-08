// Referrals Page API Route
// Protected endpoint - requires authentication
// Returns all referral network data for authenticated user

import { NextResponse } from 'next/server';
import { getReferralsPageData } from '@/lib/utils/pages';
import { getCurrentUser } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get authenticated user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all referrals page data
    const data = await getReferralsPageData(user.userId);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=120, stale-while-revalidate=240', // Cache for 2 minutes (referral data changes less frequently)
      },
    });
  } catch (error) {
    console.error('Error in referrals API:', error);

    return NextResponse.json(
      { error: 'Failed to fetch referrals page data' },
      { status: 500 }
    );
  }
}
