// Reward Calculation Service - On-the-fly reward calculations
// Responsibilities:
// - calculateMonthlyReward(stakeAmount): Calculate 8% monthly return
// - calculateDailyReward(stakeAmount): Calculate daily rate (8% / 30 days)
// - calculateTotalEarned(stake): Calculate total earned based on elapsed time
//   Formula: stakeAmount * 0.08 * monthsElapsed (max 24 months)
// - calculateMonthsElapsed(startDate): Calculate complete months since stake start
// - calculateNextWithdrawalDate(): Get next 1st of month
// - isWithdrawalAllowed(currentDate): Check if today is 1st of month
// - getStakeProgress(stake): Calculate percentage complete (months / 24)
// - Uses date-fns for date calculations
// - No database access - pure calculation logic
