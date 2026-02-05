// GET /api/stakes/summary - Get aggregated stake summary for user
// Responsibilities:
// - Authenticate user via JWT
// - Call stake-query.service.getStakeSummary(userId)
// - Return: totalStaked, totalEarned, activeStakesCount, availableWithdrawal
// - Used by dashboard header to show totals

// Placeholder route - to be implemented
export async function GET() {
  return Response.json({ message: 'Not implemented yet' }, { status: 501 });
}
