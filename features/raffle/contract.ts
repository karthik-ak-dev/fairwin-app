import { type Address } from 'viem';

export const RAFFLE_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;
export const USDC_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_USDC_CONTRACT || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359') as Address;

export const RAFFLE_ABI = [
  {
    name: 'enterRaffle', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'raffleId', type: 'uint256' }, { name: 'numEntries', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'triggerDraw', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'raffleId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdrawFees', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getRaffle', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'raffleId', type: 'uint256' }],
    outputs: [
      { name: 'entryPrice', type: 'uint256' },
      { name: 'totalEntries', type: 'uint256' },
      { name: 'prizePool', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'status', type: 'uint8' },
    ],
  },
  {
    name: 'getUserEntries', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'raffleId', type: 'uint256' }, { name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const ERC20_ABI = [
  {
    name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
