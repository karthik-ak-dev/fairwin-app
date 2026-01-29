# FairWin Blockchain Layer

This folder contains all blockchain integration code for the FairWin platform.

## Folder Structure

```
lib/blockchain/
├── addresses.ts              # Contract addresses and chain configuration
├── client.ts                 # React hooks for contract interaction (viem + wagmi)
├── index.ts                  # Central export point
├── contract-interfaces/      # Contract ABIs (JSON interface definitions)
│   └── FairWinRaffle.json
├── contracts/                # Solidity source code (reference only)
│   └── FairWinRaffle.sol
└── README.md                 # This file
```

## Key Files

### `addresses.ts`
- Contract addresses for different chains (Polygon Mainnet, Testnet)
- USDC token addresses
- Helper functions for Polygonscan URLs
- Chain-specific configuration

### `client.ts`
- `useFairWinContract()` - React hook for contract interaction
- `FAIRWIN_ABI` - Contract ABI export
- `ERC20_ABI` - Standard ERC20 token functions (for USDC)

### `contract-interfaces/FairWinRaffle.json`
- Generated interface (ABI) from compiled Solidity contract
- Used by frontend to interact with deployed contract
- Defines all available functions, events, and errors
- Required for the application to work

### `contracts/FairWinRaffle.sol`
- Full Solidity source code with extensive documentation
- Explains contract architecture, security features, and usage
- **Reference only** - not compiled in this repo
- Actual deployment happens separately

## Contract Addresses

### Polygon Mainnet (Chain ID: 137)
- **USDC**: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` (Native USDC by Circle)
- **FairWin Raffle**: Set via `NEXT_PUBLIC_CONTRACT_ADDRESS` env variable

### Polygon Amoy Testnet (Chain ID: 80002)
- **USDC**: `0x41E94Eb71898E8A2eF47C1B6a4c8B1A0fAdf3660` (Testnet USDC)
- **FairWin Raffle**: Set via `NEXT_PUBLIC_CONTRACT_ADDRESS` env variable

## Usage

### Reading Contract State

```typescript
import { useFairWinContract } from '@/lib/blockchain';

function MyComponent() {
  const { readContract, raffleAddress } = useFairWinContract();

  // Read raffle data (free, no gas)
  const raffle = await readContract.read.raffles([raffleId]);
  console.log('Raffle entries:', raffle.totalEntries);
}
```

### Writing to Contract

```typescript
import { useFairWinContract } from '@/lib/blockchain';

function EnterRaffle() {
  const { writeContract } = useFairWinContract();

  const handleEnter = async () => {
    // This costs gas and requires connected wallet
    await writeContract.write.enterRaffle([raffleId, numEntries]);
  };
}
```

### Approving USDC Spending

```typescript
import { ERC20_ABI } from '@/lib/blockchain';
import { useWriteContract } from 'wagmi';

function ApproveUSDC() {
  const { writeContract } = useWriteContract();

  const approve = async (amount: bigint) => {
    await writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [RAFFLE_ADDRESS, amount],
    });
  };
}
```

## Environment Variables

Required in `.env.local`:

```bash
# Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...      # FairWin Raffle contract
NEXT_PUBLIC_USDC_CONTRACT=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=137                # 137 = Polygon Mainnet, 80002 = Amoy Testnet

# Block Explorer
NEXT_PUBLIC_POLYGONSCAN_URL=https://polygonscan.com
```

## Security Notes

1. **Verify All Addresses**: Always verify contract addresses on official sources before use
2. **USDC Approval**: Users must approve the raffle contract to spend their USDC before entering
3. **Chain ID**: Ensure frontend and contract are on the same network
4. **Read vs Write**: Read operations are free, write operations cost gas and require wallet signature

## Contract Architecture

The FairWin Raffle contract uses:
- **Chainlink VRF** for provably fair random winner selection
- **USDC** as the entry currency (ERC20 token)
- **OpenZeppelin** libraries for security (Ownable, Pausable, ReentrancyGuard)
- **Polygon** for fast, low-cost transactions

See `solidity/FairWinRaffle.sol` for full implementation details and documentation.

## Integration with Service Layer

The blockchain layer is used by the service layer (`lib/services/`) for:
- Verifying entry transactions on-chain
- Requesting random numbers from Chainlink VRF
- Processing winner payouts
- Reading raffle state for validation

See `lib/services/README.md` (to be created) for service layer integration patterns.
