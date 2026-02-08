// Blockchain Utilities
// BSC (Binance Smart Chain) transaction verification and execution

import { ethers } from 'ethers';
import { constants } from '@/lib/constants';

// USDT Contract ABI (only functions we need)
const USDT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
];

/**
 * Get BSC provider instance
 */
function getBscProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.BSC_RPC_URL;
  if (!rpcUrl) {
    throw new Error('BSC_RPC_URL environment variable not set');
  }
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get admin wallet instance for executing transactions
 */
function getAdminWallet(): ethers.Wallet {
  const privateKey = process.env.BSC_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('BSC_PRIVATE_KEY environment variable not set');
  }
  const provider = getBscProvider();
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Get USDT contract instance
 */
function getUsdtContract(signer?: ethers.Wallet): ethers.Contract {
  const contractAddress = process.env.BSC_USDT_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('BSC_USDT_CONTRACT_ADDRESS environment variable not set');
  }
  const provider = signer || getBscProvider();
  return new ethers.Contract(contractAddress, USDT_ABI, provider);
}

/**
 * Verify BSC transaction
 * Checks if transaction exists, is confirmed, and matches expected amount
 */
export async function verifyBscTransaction(
  txHash: string,
  expectedAmount: number
): Promise<boolean> {
  // Skip validation if SKIP_BLOCKCHAIN_VALIDATION is enabled
  if (process.env.SKIP_BLOCKCHAIN_VALIDATION === 'true') {
    console.log(`⚠️ Blockchain validation skipped for txHash: ${txHash} (amount: ${expectedAmount})`);
    return true;
  }

  try {
    const provider = getBscProvider();

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      console.log(`Transaction not found: ${txHash}`);
      return false;
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      console.log(`Transaction failed: ${txHash}`);
      return false;
    }

    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.log(`Transaction details not found: ${txHash}`);
      return false;
    }

    // Verify transaction is to USDT contract
    const usdtContractAddress = process.env.BSC_USDT_CONTRACT_ADDRESS;
    if (tx.to?.toLowerCase() !== usdtContractAddress?.toLowerCase()) {
      console.log(`Transaction not to USDT contract: ${txHash}`);
      return false;
    }

    // Parse transaction data to get transfer amount
    const iface = new ethers.Interface(USDT_ABI);
    const decodedData = iface.parseTransaction({ data: tx.data, value: tx.value });

    if (!decodedData || decodedData.name !== 'transfer') {
      console.log(`Transaction is not a transfer: ${txHash}`);
      return false;
    }

    const transferAmount = decodedData.args[1];
    const amountInUsdt = Number(ethers.formatUnits(transferAmount, 18));

    // Verify amount matches (with tolerance for rounding)
    if (Math.abs(amountInUsdt - expectedAmount) > constants.AMOUNT_VERIFICATION_TOLERANCE) {
      console.log(
        `Amount mismatch: expected ${expectedAmount}, got ${amountInUsdt}`
      );
      return false;
    }

    // Check minimum confirmations
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - (receipt.blockNumber || 0);
    if (confirmations < constants.MIN_BLOCKCHAIN_CONFIRMATIONS) {
      console.log(`Insufficient confirmations: ${confirmations}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying BSC transaction:', error);
    return false;
  }
}

/**
 * Execute BSC transfer (withdrawal)
 * Sends USDT from admin wallet to user's wallet address
 */
export async function executeBscTransfer(
  toAddress: string,
  amount: number
): Promise<string> {
  // Skip actual transfer if SKIP_BLOCKCHAIN_VALIDATION is enabled
  if (process.env.SKIP_BLOCKCHAIN_VALIDATION === 'true') {
    const mockTxHash = `0xmock${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
    console.log(`⚠️ Blockchain transfer skipped - Mock txHash: ${mockTxHash} (to: ${toAddress}, amount: ${amount})`);
    return mockTxHash;
  }

  try {
    const wallet = getAdminWallet();
    const usdtContract = getUsdtContract(wallet);

    // Convert amount to wei (USDT uses 18 decimals on BSC)
    const amountInWei = ethers.parseUnits(amount.toString(), 18);

    // Execute transfer
    const tx = await usdtContract.transfer(toAddress, amountInWei);

    // Wait for transaction to be mined
    await tx.wait(1);

    return tx.hash;
  } catch (error: any) {
    console.error('Error executing BSC transfer:', error);
    throw new Error(`Failed to execute transfer: ${error.message}`);
  }
}

/**
 * Wait for BSC transaction confirmation
 */
export async function waitForBscConfirmation(
  txHash: string,
  requiredConfirmations: number = constants.MIN_BLOCKCHAIN_CONFIRMATIONS,
  timeout: number = constants.BLOCKCHAIN_CONFIRMATION_TIMEOUT_MS
): Promise<boolean> {
  // Skip confirmation wait if SKIP_BLOCKCHAIN_VALIDATION is enabled
  if (process.env.SKIP_BLOCKCHAIN_VALIDATION === 'true') {
    console.log(`⚠️ Blockchain confirmation wait skipped for txHash: ${txHash}`);
    return true;
  }

  try {
    const provider = getBscProvider();
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        await new Promise((resolve) => setTimeout(resolve, constants.BSC_POLLING_INTERVAL_MS));
        continue;
      }

      if (receipt.status !== 1) {
        console.log(`Transaction failed: ${txHash}`);
        return false;
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - (receipt.blockNumber || 0);

      if (confirmations >= requiredConfirmations) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, constants.BSC_POLLING_INTERVAL_MS));
    }

    console.log(`Confirmation timeout for transaction: ${txHash}`);
    return false;
  } catch (error) {
    console.error('Error waiting for BSC confirmation:', error);
    return false;
  }
}
