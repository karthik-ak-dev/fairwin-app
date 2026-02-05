// GET /api/withdrawals/history - Get withdrawal history for user
// Responsibilities:
// - Authenticate user via JWT
// - Call withdrawal.repository.getWithdrawalsByUserId(userId)
// - Return array of past withdrawals with status and txHash
// - Used by profile page to show withdrawal history

// Placeholder route - to be implemented
export async function GET() {
  return Response.json({ message: 'Not implemented yet' }, { status: 501 });
}
