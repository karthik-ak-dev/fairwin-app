export { RaffleRepository } from './raffle.repository';
export { EntryRepository } from './entry.repository';
export { UserRepository } from './user.repository';
export { WinnerRepository } from './winner.repository';
export { PayoutRepository } from './payout.repository';
export { StatsRepository } from './stats.repository';

import { RaffleRepository } from './raffle.repository';
import { EntryRepository } from './entry.repository';
import { UserRepository } from './user.repository';
import { WinnerRepository } from './winner.repository';
import { PayoutRepository } from './payout.repository';
import { StatsRepository } from './stats.repository';

export const raffleRepo = new RaffleRepository();
export const entryRepo = new EntryRepository();
export const userRepo = new UserRepository();
export const winnerRepo = new WinnerRepository();
export const payoutRepo = new PayoutRepository();
export const statsRepo = new StatsRepository();
