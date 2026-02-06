// Binance Smart Chain (BSC) Blockchain Service
// Responsibilities:
// - Verify BSC transactions (user deposits)
// - Execute BSC transfers (withdrawals)
// - Wait for blockchain confirmations

import { ethers } from 'ethers';

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
 * @param txHash - Transaction hash to verify
 * @param expectedAmount - Expected amount in USDT (not wei)
 * @returns true if transaction is valid, false otherwise
 */
export async function verifyBscTransaction(
  txHash: string,
  expectedAmount: number
): Promise<boolean> {
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
    // USDT uses 18 decimals on BSC
    const iface = new ethers.Interface(USDT_ABI);
    const decodedData = iface.parseTransaction({ data: tx.data, value: tx.value });

    if (!decodedData || decodedData.name !== 'transfer') {
      console.log(`Transaction is not a transfer: ${txHash}`);
      return false;
    }

    const transferAmount = decodedData.args[1];
    const amountInUsdt = Number(ethers.formatUnits(transferAmount, 18));

    // Verify amount matches (with 0.01 tolerance for rounding)
    const tolerance = 0.01;
    if (Math.abs(amountInUsdt - expectedAmount) > tolerance) {
      console.log(
        `Amount mismatch: expected ${expectedAmount}, got ${amountInUsdt}`
      );
      return false;
    }

    // Check minimum confirmations (at least 3 blocks)
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - (receipt.blockNumber || 0);
    if (confirmations < 3) {
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
 * @param toAddress - Recipient wallet address
 * @param amount - Amount in USDT (not wei)
 * @returns Transaction hash if successful
 */
export async function executeBscTransfer(
  toAddress: string,
  amount: number
): Promise<string> {
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
 * @param txHash - Transaction hash to monitor
 * @param requiredConfirmations - Number of confirmations to wait for (default 3)
 * @param timeout - Timeout in milliseconds (default 5 minutes)
 * @returns true if confirmed, false if timeout or failed
 */
export async function waitForBscConfirmation(
  txHash: string,
  requiredConfirmations: number = 3,
  timeout: number = 5 * 60 * 1000 // 5 minutes
): Promise<boolean> {
  try {
    const provider = getBscProvider();
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        // Transaction not yet mined, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
        continue;
      }

      // Check if transaction failed
      if (receipt.status !== 1) {
        console.log(`Transaction failed: ${txHash}`);
        return false;
      }

      // Check confirmations
      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - (receipt.blockNumber || 0);

      if (confirmations >= requiredConfirmations) {
        return true;
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    console.log(`Confirmation timeout for transaction: ${txHash}`);
    return false;
  } catch (error) {
    console.error('Error waiting for BSC confirmation:', error);
    return false;
  }
}
