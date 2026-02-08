// Landing Page API Route
// Public endpoint - no authentication required
// Returns platform statistics and referral rates

import { NextResponse } from 'next/server';
import { getLandingPageData } from '@/lib/utils/pages';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLandingPageData();
    console.log('Landing page data:', data);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error in landing API:', error);

    return NextResponse.json(
      { error: 'Failed to fetch landing page data' },
      { status: 500 }
    );
  }
}
