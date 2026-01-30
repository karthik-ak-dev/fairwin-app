// SPDX-License-Identifier: MIT
// ^^^ This line declares the license. MIT is open-source, meaning anyone can use/modify this code.

pragma solidity ^0.8.20;
// ^^^ Tells the compiler which Solidity version to use.
// ^0.8.20 means "version 0.8.20 or higher, but below 0.9.0"
// Solidity 0.8+ has built-in overflow protection (no more SafeMath needed!)

/**
 * =============================================================================
 *                        FAIRWIN RAFFLE CONTRACT V2
 * =============================================================================
 *
 * WHAT THIS CONTRACT DOES:
 * ------------------------
 * This is an on-chain raffle/lottery system. Users pay to enter, and when the
 * raffle ends, random winners are selected using Chainlink VRF (Verifiable
 * Random Function) to ensure fairness.
 *
 * KEY FEATURES:
 * - Multiple winners (10% of participants win, configurable)
 * - Provably fair randomness (Chainlink VRF - impossible to cheat)
 * - Capped platform fee (maximum 5%, hardcoded for trust)
 * - Non-custodial (funds go directly to smart contract, not a person)
 *
 * HOW A RAFFLE WORKS:
 * 1. Admin creates a raffle with settings (price, duration, winner %)
 * 2. Users enter by paying USDC (entries recorded on blockchain)
 * 3. When time ends, admin triggers the draw
 * 4. Contract requests random numbers from Chainlink
 * 5. Chainlink sends back verified random numbers
 * 6. Contract selects winners and sends them prizes automatically
 * 7. Platform fee is collected (max 5%)
 *
 * WHY BLOCKCHAIN?
 * - Transparent: Anyone can verify the code and see all transactions
 * - Trustless: No one can cheat or manipulate the results
 * - Automatic: Winners get paid instantly by the contract
 * - Immutable: Rules can't be changed after raffle starts
 *
 * =============================================================================
 */


// =============================================================================
// IMPORTS - External code libraries we're using
// =============================================================================

/**
 * OpenZeppelin Contracts
 * ----------------------
 * OpenZeppelin is the industry standard for secure smart contract development.
 * These are battle-tested, audited contracts used by billions of dollars in DeFi.
 * Website: https://openzeppelin.com/contracts
 *
 * Think of imports like using libraries in any programming language.
 * Instead of writing security code from scratch, we use proven solutions.
 */

// Ownable2Step: Manages who "owns" (administers) this contract
// Why "2Step"? Safer ownership transfer - new owner must accept, preventing accidents
// Example: If you accidentally set wrong address, they must accept before becoming owner
import "@openzeppelin/contracts/access/Ownable2Step.sol";

// Pausable: Emergency stop button for the contract
// If something goes wrong, owner can pause to prevent further damage
// Users can still claim refunds when paused (important for safety)
import "@openzeppelin/contracts/utils/Pausable.sol";

// ReentrancyGuard: Prevents a specific type of hack called "reentrancy attack"
// How reentrancy works: Attacker calls a function, and before it finishes,
// calls it again recursively to drain funds. This guard prevents that.
// Famous example: The DAO hack in 2016 lost $60M due to reentrancy
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// IERC20: Interface for interacting with ERC20 tokens (like USDC)
// ERC20 is the standard for tokens on Ethereum/Polygon
// "Interface" means it defines WHAT functions exist, not HOW they work
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// SafeERC20: Wrapper for safe token transfers
// Some tokens don't follow the ERC20 standard exactly (USDT is famous for this)
// SafeERC20 handles these edge cases so transfers always work correctly
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * Chainlink VRF (Verifiable Random Function)
 * ------------------------------------------
 * Getting random numbers on blockchain is HARD. Why?
 * - Everything on blockchain is deterministic (same input = same output)
 * - Miners/validators can see pending transactions and manipulate them
 * - Using block hash as randomness can be gamed by miners
 *
 * Chainlink VRF solves this:
 * 1. We request a random number
 * 2. Chainlink generates it OFF-CHAIN with cryptographic proof
 * 3. They send back the number + proof
 * 4. Anyone can verify the proof on-chain (proves it wasn't manipulated)
 *
 * Cost: Each random request costs LINK tokens (Chainlink's cryptocurrency)
 * Website: https://vrf.chain.link
 */
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";


// =============================================================================
// MAIN CONTRACT
// =============================================================================

/**
 * CONTRACT INHERITANCE
 * --------------------
 * "is X, Y, Z" means this contract inherits from multiple parent contracts.
 * It's like a class extending multiple classes in OOP.
 *
 * We inherit from:
 * - Ownable2Step: Gives us onlyOwner modifier and ownership management
 * - Pausable: Gives us whenNotPaused modifier and pause/unpause functions
 * - ReentrancyGuard: Gives us nonReentrant modifier
 * - VRFConsumerBaseV2: Required by Chainlink to receive random numbers
 */
contract FairWinRaffle is Ownable2Step, Pausable, ReentrancyGuard, VRFConsumerBaseV2 {

    /**
     * USING STATEMENT
     * ---------------
     * "using SafeERC20 for IERC20" attaches SafeERC20's functions to IERC20.
     * Instead of: SafeERC20.safeTransfer(token, recipient, amount)
     * We can write: token.safeTransfer(recipient, amount)
     *
     * It's syntactic sugar (makes code cleaner to read).
     */
    using SafeERC20 for IERC20;


    // =========================================================================
    // CONSTANTS - Values that can NEVER change after deployment
    // =========================================================================

    /**
     * WHAT ARE CONSTANTS?
     * -------------------
     * Constants are values baked into the contract code itself.
     * They CANNOT be changed, even by the owner/admin.
     *
     * WHY USE CONSTANTS?
     * - Trust: Users can verify these values will never change
     * - Gas savings: Constants are cheaper than storage variables
     * - Security: Critical limits can't be modified maliciously
     *
     * HOW TO VERIFY?
     * Anyone can read the contract source code on Polygonscan and see these values.
     */

    /**
     * @notice Maximum platform fee the admin can ever set
     * @dev This is the MOST IMPORTANT trust guarantee in the contract
     *
     * Set to 5 means: Maximum 5% fee, so winners always get at least 95%
     *
     * TRUST IMPLICATION:
     * Even if the admin wanted to, they CANNOT take more than 5%.
     * This is enforced by code, not by promise.
     */
    uint256 public constant MAX_PLATFORM_FEE_PERCENT = 5;

    /**
     * @notice Minimum percentage of pool that goes to winners
     * @dev Derived from MAX_PLATFORM_FEE_PERCENT (100 - 5 = 95)
     */
    uint256 public constant MIN_WINNER_SHARE_PERCENT = 95;

    /**
     * @notice Maximum number of winners per raffle
     * @dev Why limit this?
     *
     * 1. GAS COSTS: Each winner needs a transfer. 100 transfers = ~2.5M gas.
     *    If unlimited, a raffle with 10,000 winners would fail (out of gas).
     *
     * 2. VRF COSTS: We request one random number per winner from Chainlink.
     *    More random numbers = more LINK tokens spent.
     *
     * 3. BLOCK LIMITS: Polygon blocks have a gas limit (~30M).
     *    Too many operations in one transaction = transaction fails.
     *
     * 100 winners is a safe, tested limit that works reliably.
     */
    uint256 public constant MAX_WINNERS = 100;

    /**
     * @notice Maximum percentage of participants who can win
     * @dev Set to 50 means at most half the players can win
     *
     * Why cap at 50%?
     * - Keeps it feeling like a lottery (not everyone wins)
     * - Higher percentages would make prizes very small
     * - 50% is already very generous compared to traditional lotteries
     */
    uint256 public constant MAX_WINNER_PERCENT = 50;

    /**
     * @notice Minimum percentage of participants who win
     * @dev Set to 1 means at least 1% of players win
     *
     * Example: 100 players with 1% = 1 winner (traditional jackpot style)
     */
    uint256 public constant MIN_WINNER_PERCENT = 1;

    /**
     * @notice Minimum raffle duration
     * @dev 1 hours = 3600 seconds
     *
     * Why minimum 1 hour?
     * - Gives people time to enter
     * - Prevents "flash raffles" that could be gamed
     * - More fair for users in different time zones
     */
    uint256 public constant MIN_RAFFLE_DURATION = 1 hours;

    /**
     * @notice Maximum raffle duration
     * @dev 30 days in seconds
     *
     * Why maximum 30 days?
     * - Prevents funds being locked forever
     * - Keeps raffles active and engaging
     * - Can always create new raffle after one ends
     */
    uint256 public constant MAX_RAFFLE_DURATION = 30 days;

    /**
     * @notice Minimum entry price in USDC
     * @dev 10000 = $0.01 (USDC has 6 decimals)
     *
     * UNDERSTANDING TOKEN DECIMALS:
     * USDC uses 6 decimal places, so:
     * - 1 USDC = 1,000,000 (1 * 10^6)
     * - $0.01 = 10,000
     * - $1.00 = 1,000,000
     * - $100 = 100,000,000
     *
     * This is like cents, but with more precision.
     * When you see "3000000" in the contract, that's $3.00
     */
    uint256 public constant MIN_ENTRY_PRICE = 10000;

    /**
     * @notice USDC decimal places
     * @dev Used for calculations and display
     */
    uint256 public constant USDC_DECIMALS = 6;


    // =========================================================================
    // IMMUTABLE STATE - Set once at deployment, never changes
    // =========================================================================

    /**
     * IMMUTABLE vs CONSTANT
     * ---------------------
     * - constant: Value known at compile time (hardcoded in code)
     * - immutable: Value set in constructor, then never changes
     *
     * Both save gas compared to regular storage variables because
     * they're stored in the contract's bytecode, not in storage.
     */

    /**
     * @notice The USDC token contract we accept for payments
     * @dev Immutable means this address is set once and CANNOT change
     *
     * USDC on Polygon Mainnet: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
     * (Always verify addresses on official Circle/USDC documentation!)
     *
     * WHY IMMUTABLE?
     * If this could be changed, a malicious admin could:
     * 1. Create a raffle accepting USDC
     * 2. Get users to deposit
     * 3. Change to a worthless token
     * 4. Steal all the real USDC
     *
     * By making it immutable, users know exactly what token they're using forever.
     */
    IERC20 public immutable usdc;

    /**
     * @notice Chainlink VRF Coordinator contract
     * @dev This is the Chainlink contract that provides random numbers
     *
     * Polygon Mainnet VRF Coordinator: 0xAE975071Be8F8eE67addBC1A82488F1C24858067
     * (Always verify on Chainlink's official documentation!)
     *
     * WHY IMMUTABLE?
     * Prevents anyone from pointing to a fake "VRF" that returns predictable numbers.
     */
    VRFCoordinatorV2Interface public immutable vrfCoordinator;


    // =========================================================================
    // CONFIGURABLE STATE - Admin can modify these
    // =========================================================================

    /**
     * STORAGE VARIABLES
     * -----------------
     * These variables are stored on the blockchain (in "storage").
     * Reading them is free (view functions).
     * Writing them costs gas.
     *
     * Think of storage like a database that lives on every Ethereum node worldwide.
     */

    // -------------------------------------------------------------------------
    // VRF Configuration
    // -------------------------------------------------------------------------

    /**
     * @notice Chainlink VRF subscription ID
     * @dev You create a subscription at https://vrf.chain.link
     *
     * HOW VRF SUBSCRIPTIONS WORK:
     * 1. Go to vrf.chain.link
     * 2. Create a subscription
     * 3. Fund it with LINK tokens
     * 4. Add this contract as a "consumer"
     * 5. Contract can now request random numbers
     *
     * Each random request costs LINK from your subscription balance.
     * If subscription runs out of LINK, random requests will fail!
     */
    uint64 public vrfSubscriptionId;

    /**
     * @notice VRF key hash (determines which Chainlink oracle network to use)
     * @dev Different key hashes = different gas price tiers
     *
     * Polygon has multiple options:
     * - 500 gwei (faster, more expensive)
     * - 200 gwei (slower, cheaper)
     *
     * The key hash you use should match your subscription's configuration.
     */
    bytes32 public vrfKeyHash;

    /**
     * @notice Maximum gas Chainlink can use when calling us back
     * @dev Set high (2.5M) because we're doing multiple winner transfers
     *
     * CALLBACK GAS EXPLAINED:
     * When Chainlink has our random numbers ready, they call our
     * fulfillRandomWords function. This setting limits how much gas
     * that callback can use.
     *
     * Why 2,500,000?
     * - Selecting 100 winners + 100 transfers uses ~2M gas
     * - We add buffer for safety
     * - If set too low, callback fails and raffle gets stuck
     */
    uint32 public vrfCallbackGasLimit = 2500000;

    /**
     * @notice How many blocks to wait before VRF responds
     * @dev Higher = more secure, Lower = faster
     *
     * WHY WAIT FOR BLOCK CONFIRMATIONS?
     * - Prevents block reorg attacks
     * - With 3 confirmations, attacker would need to rewrite 3 blocks
     * - On Polygon, 3 blocks ≈ 6 seconds
     *
     * 3 is the standard recommendation from Chainlink.
     */
    uint16 public vrfRequestConfirmations = 3;

    // -------------------------------------------------------------------------
    // Global Limits (Safety Rails)
    // -------------------------------------------------------------------------

    /**
     * @notice Maximum total pool size in USDC
     * @dev 50000 * 10^6 = $50,000
     *
     * WHY LIMIT POOL SIZE?
     * - Risk management: Limits exposure if there's a bug
     * - Start conservative: Increase as platform builds trust
     * - Regulatory: Some jurisdictions have limits on prize pools
     *
     * This can be increased over time as the platform proves itself.
     */
    uint256 public maxPoolSize = 50000 * 10**6;

    /**
     * @notice Maximum entries one user can buy per raffle
     * @dev Prevents "whale" domination
     *
     * WHY LIMIT PER-USER ENTRIES?
     * - Fairness: One rich person shouldn't have 90% of entries
     * - Decentralization: Better distribution of winners
     * - UX: Other users feel they have a real chance
     *
     * 100 entries at $3 each = $300 max per person
     */
    uint256 public maxEntriesPerUser = 100;

    /**
     * @notice Minimum entries required for raffle to run
     * @dev If not met, raffle is cancelled and everyone gets refunded
     *
     * WHY MINIMUM ENTRIES?
     * - Prevents running raffle with only 1 person (they'd just win their own money back)
     * - Ensures meaningful prize pool
     * - 2 is the absolute minimum for it to be a "raffle"
     */
    uint256 public minEntriesRequired = 2;

    // -------------------------------------------------------------------------
    // Counters & Tracking
    // -------------------------------------------------------------------------

    /**
     * @notice Next raffle ID to be assigned
     * @dev Starts at 1, increments with each new raffle
     *
     * WHY START AT 1?
     * - 0 is often used to check "does this exist?"
     * - If raffleId 0 meant "first raffle", we couldn't distinguish from "no raffle"
     */
    uint256 public nextRaffleId = 1;

    /**
     * @notice Total protocol fees available for withdrawal
     * @dev This is the ONLY money admin can withdraw
     *
     * CRITICAL SECURITY POINT:
     * This counter ONLY increases when a raffle completes.
     * Admin's withdrawFees function can ONLY access this amount.
     * Active raffle pools are completely separate and untouchable.
     */
    uint256 public protocolFeesCollected;

    // -------------------------------------------------------------------------
    // Emergency Cancel Protection
    // -------------------------------------------------------------------------

    /**
     * @notice Minimum delay before emergency cancel can be triggered
     * @dev Set to 12 hours - VRF normally responds in <5 minutes
     *
     * WHY 12 HOURS?
     * - VRF usually responds in 30 seconds - 5 minutes
     * - Worst case during network congestion: 1-2 hours
     * - 12 hours is long enough to ensure VRF genuinely failed
     * - Prevents admin from canceling right after seeing unfavorable winners
     * - Still short enough for same-day recovery
     *
     * TRUST GUARANTEE:
     * Even if admin wanted to abuse emergencyCancelDrawing, they must wait
     * 12 hours - by then VRF will have definitely responded or definitely failed.
     */
    uint256 public constant EMERGENCY_CANCEL_DELAY = 12 hours;

    /**
     * @notice Tracks when draw was triggered for each raffle
     * @dev Used to enforce EMERGENCY_CANCEL_DELAY
     *
     * Maps raffleId → timestamp when triggerDraw was called
     */
    mapping(uint256 => uint256) public drawTriggeredAt;


    // =========================================================================
    // DATA STRUCTURES - Custom types we define
    // =========================================================================

    /**
     * ENUMS AND STRUCTS
     * -----------------
     * Solidity lets us define custom data types:
     * - enum: A fixed set of named options (like "Active", "Completed", etc.)
     * - struct: A custom object with multiple fields (like a class in other languages)
     */

    /**
     * @notice All possible states a raffle can be in
     * @dev This is called a "state machine" pattern
     *
     * STATE MACHINE VISUALIZATION:
     *
     *                         [triggerDraw]
     *     [createRaffle]          ↓
     *           ↓            ┌─────────┐      [VRF callback]
     *      ┌────────┐        │         │           ↓
     *      │ Active │───────→│ Drawing │──────→ Completed
     *      └────────┘        │         │
     *           │            └─────────┘
     *           │                 │
     *    [cancelRaffle]    [emergencyCancel]
     *           │                 │
     *           ↓                 ↓
     *      ┌───────────────────────┐
     *      │      Cancelled        │
     *      └───────────────────────┘
     *
     * VALID TRANSITIONS:
     * - Active → Drawing (when triggerDraw is called after end time)
     * - Active → Cancelled (when admin cancels or min entries not met)
     * - Drawing → Completed (when Chainlink sends random numbers)
     * - Drawing → Cancelled (emergency only, if VRF fails)
     *
     * INVALID TRANSITIONS (blocked by code):
     * - Can't go from Completed to anything (final state)
     * - Can't go from Cancelled to anything (final state)
     * - Can't go from Drawing back to Active
     */
    enum RaffleState {
        Active,     // 0: Raffle is running, accepting entries
        Drawing,    // 1: Entries closed, waiting for random numbers
        Completed,  // 2: Winners selected and paid
        Cancelled   // 3: Raffle cancelled, refunds available
    }

    /**
     * @notice All information about a single raffle
     * @dev Stored in the `raffles` mapping
     *
     * STRUCT LAYOUT:
     * Solidity packs struct variables into 32-byte storage slots.
     * We order fields to minimize storage slots used (gas optimization).
     */
    struct Raffle {
        // === Configuration (set at creation, never changes) ===

        uint256 entryPrice;         // Price per entry in USDC (6 decimals)
                                    // Example: 3000000 = $3.00

        uint256 startTime;          // Unix timestamp when raffle started
                                    // Unix time = seconds since Jan 1, 1970
                                    // Example: 1706450400 = Jan 28, 2024 2:00 PM UTC

        uint256 endTime;            // Unix timestamp when entries close
                                    // After this time, no more entries allowed

        uint256 maxEntries;         // Maximum total entries allowed (0 = unlimited)
                                    // Used to cap pool size for specific raffles

        uint256 winnerPercent;      // What % of participants win (1-50)
                                    // Example: 10 means 10% win
                                    // 100 entries with 10% = 10 winners

        uint256 platformFeePercent; // Platform fee for this raffle (0-5)
                                    // Example: 5 means 5% fee
                                    // $300 pool with 5% fee = $15 to platform

        // === Current State (changes as raffle progresses) ===

        RaffleState state;          // Current state (Active/Drawing/Completed/Cancelled)

        uint256 totalEntries;       // How many entries have been purchased

        uint256 totalPool;          // Total USDC collected (in 6 decimals)
                                    // Example: 300000000 = $300.00

        // === Results (filled in after draw) ===

        uint256 numWinners;         // How many winners were selected
                                    // Might be less than calculated if capped at 100

        // NOTE: Individual prize amounts stored in rafflePrizes mapping
        // Removed prizePerWinner field - winners get tiered amounts (40/30/30)

        uint256 vrfRequestId;       // Chainlink request ID for tracking
                                    // Used to match callback to correct raffle
    }

    /**
     * @notice Tracks a user's participation in a specific raffle
     *
     * WHY TRACK THIS?
     * - Know how many entries each user has (for max limit)
     * - Calculate refund amount if cancelled
     * - Prevent double refund claims
     */
    struct UserEntry {
        uint256 numEntries;     // How many entries user purchased
        uint256 startIndex;     // Index of their first entry (for winner lookup)
        bool refundClaimed;     // Have they claimed refund? (prevents double-claim)
    }


    // =========================================================================
    // MAPPINGS - Key-value storage (like a hash table / dictionary)
    // =========================================================================

    /**
     * WHAT ARE MAPPINGS?
     * ------------------
     * Mappings are like dictionaries/hash tables in other languages.
     * mapping(KeyType => ValueType) means: given a key, get a value.
     *
     * Key properties:
     * - O(1) lookup (constant time, very fast)
     * - Can't iterate over (no way to list all keys)
     * - Non-existent keys return default value (0, false, empty)
     */

    /**
     * @notice All raffles stored by ID
     * @dev raffles[1] = first raffle, raffles[2] = second raffle, etc.
     */
    mapping(uint256 => Raffle) public raffles;

    /**
     * @notice User entries per raffle
     * @dev userEntries[raffleId][userAddress] = their entry info
     *
     * Example: userEntries[1][0xABC...] = entries for user 0xABC in raffle 1
     */
    mapping(uint256 => mapping(address => UserEntry)) public userEntries;

    /**
     * @notice Maps entry index to owner address
     * @dev entryOwners[raffleId][entryIndex] = who owns that entry
     *
     * Example: If Alice buys entries 0-4, Bob buys 5-9:
     * entryOwners[1][0] = Alice
     * entryOwners[1][4] = Alice
     * entryOwners[1][5] = Bob
     * entryOwners[1][9] = Bob
     *
     * When random number selects entry #7, we look up entryOwners[1][7] = Bob wins!
     */
    mapping(uint256 => mapping(uint256 => address)) public entryOwners;

    /**
     * @notice Maps VRF request ID back to raffle ID
     * @dev When Chainlink calls back, we need to know which raffle it's for
     *
     * Flow:
     * 1. We call VRF, get requestId 12345
     * 2. We store: vrfRequestToRaffle[12345] = raffleId 1
     * 3. Chainlink calls fulfillRandomWords with requestId 12345
     * 4. We look up: vrfRequestToRaffle[12345] = 1, so it's for raffle 1
     */
    mapping(uint256 => uint256) public vrfRequestToRaffle;

    /**
     * @notice List of winners for each raffle
     * @dev raffleWinners[raffleId] = array of winner addresses
     *
     * Why array? So we can return all winners in one call.
     * Frontend can show: "Winners: Alice, Bob, Carol, ..."
     */
    mapping(uint256 => address[]) public raffleWinners;

    /**
     * @notice Quick lookup: did this address win this raffle?
     * @dev isWinner[raffleId][address] = true/false
     *
     * Used for:
     * 1. Ensuring unique winners (same person can't win twice)
     * 2. Quick check for frontend: "Did I win?"
     */
    mapping(uint256 => mapping(address => bool)) public isWinner;


    // =========================================================================
    // EVENTS - Logs emitted for off-chain tracking
    // =========================================================================

    /**
     * WHAT ARE EVENTS?
     * ----------------
     * Events are logs stored on the blockchain that external systems can listen to.
     * They're NOT stored in contract storage (cheaper than storage).
     *
     * USE CASES:
     * - Frontend listens for RaffleEntered to update UI in real-time
     * - Backend indexes WinnersSelected to send notifications
     * - Analytics track all activity without reading contract state
     *
     * The `indexed` keyword makes that parameter searchable.
     * You can filter: "Show me all RaffleEntered events for user 0xABC"
     */

    /// @notice Emitted when a new raffle is created
    event RaffleCreated(
        uint256 indexed raffleId,       // indexed = searchable
        uint256 entryPrice,
        uint256 startTime,
        uint256 endTime,
        uint256 maxEntries,
        uint256 winnerPercent,
        uint256 platformFeePercent
    );

    /// @notice Emitted when someone enters a raffle
    event RaffleEntered(
        uint256 indexed raffleId,
        address indexed user,           // indexed = can search by user
        uint256 numEntries,
        uint256 totalUserEntries,       // their total after this entry
        uint256 amountPaid
    );

    /// @notice Emitted when draw is triggered (VRF requested)
    event DrawTriggered(
        uint256 indexed raffleId,
        uint256 vrfRequestId,
        uint256 expectedWinners
    );

    /// @notice Emitted when winners are selected and paid
    event WinnersSelected(
        uint256 indexed raffleId,
        address[] winners,              // array of all winner addresses
        uint256 prizePerWinner,
        uint256 totalPrize,
        uint256 protocolFee
    );

    /// @notice Emitted when raffle is cancelled
    event RaffleCancelled(
        uint256 indexed raffleId,
        string reason
    );

    /// @notice Emitted when user claims refund from cancelled raffle
    event RefundClaimed(
        uint256 indexed raffleId,
        address indexed user,
        uint256 amount
    );

    /// @notice Emitted when admin withdraws protocol fees
    event FeesWithdrawn(
        address indexed to,
        uint256 amount
    );

    /// @notice Emitted when VRF config is updated
    event VRFConfigUpdated(
        uint64 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    );

    /// @notice Emitted when global limits are updated
    event LimitsUpdated(
        uint256 maxPoolSize,
        uint256 maxEntriesPerUser,
        uint256 minEntriesRequired
    );


    // =========================================================================
    // CUSTOM ERRORS - Gas-efficient error handling
    // =========================================================================

    /**
     * CUSTOM ERRORS vs REQUIRE STRINGS
     * --------------------------------
     * Old way: require(condition, "Error message")
     * New way: if (!condition) revert CustomError()
     *
     * Why custom errors?
     * - Gas efficient: Error names are encoded as 4 bytes, not full strings
     * - Can include parameters: revert InsufficientBalance(required, actual)
     * - Cleaner code: Descriptive names in the error definition
     *
     * Example gas savings: ~200 gas per revert (adds up with many checks)
     */

    error RaffleNotFound();              // Raffle ID doesn't exist
    error RaffleNotActive();             // Raffle not accepting entries
    error RaffleNotEnded();              // Tried to draw before end time
    error RaffleStillActive();           // Tried to draw while still running
    error InvalidEntryCount();           // Tried to buy 0 entries
    error ExceedsMaxEntriesPerUser();    // User trying to exceed their limit
    error ExceedsMaxPoolSize();          // Pool would exceed safety limit
    error ExceedsMaxEntries();           // Raffle is full
    error RaffleNotCancelled();          // Tried to refund non-cancelled raffle
    error RefundAlreadyClaimed();        // User already got their refund
    error NoRefundAvailable();           // User has no entries to refund
    error NoFeesToWithdraw();            // No fees accumulated
    error InvalidDuration();             // Duration outside allowed range
    error InvalidEntryPrice();           // Price below minimum
    error InvalidWinnerPercent();        // Winner % outside 1-50 range
    error InvalidPlatformFee();          // Fee above 5%
    error InvalidState();                // Wrong state for this operation
    error NotEnoughEntries();            // Below minimum entries
    error ZeroAddress();                 // Can't use address(0)
    error ZeroAmount();                  // Can't use amount 0
    error TooEarlyForEmergencyCancel();  // Must wait EMERGENCY_CANCEL_DELAY before emergency cancel


    // =========================================================================
    // CONSTRUCTOR - Runs ONCE when contract is deployed
    // =========================================================================

    /**
     * WHAT IS A CONSTRUCTOR?
     * ----------------------
     * The constructor is called exactly once: when the contract is deployed.
     * It sets up initial state that the contract needs to function.
     *
     * After deployment, the constructor can never be called again.
     * Any parameters passed here become part of the contract's permanent state.
     *
     * @param _usdc Address of the USDC token contract on this chain
     * @param _vrfCoordinator Address of Chainlink VRF Coordinator on this chain
     * @param _subscriptionId Your Chainlink VRF subscription ID
     * @param _keyHash The VRF key hash (determines oracle network/gas lane)
     */
    constructor(
        address _usdc,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    )
        Ownable(msg.sender)                    // Set deployer as owner
        VRFConsumerBaseV2(_vrfCoordinator)     // Initialize VRF consumer
    {
        // Check for zero addresses (common mistake that would break the contract)
        if (_usdc == address(0)) revert ZeroAddress();
        if (_vrfCoordinator == address(0)) revert ZeroAddress();

        // Set immutable variables (can never be changed after this)
        usdc = IERC20(_usdc);
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);

        // Set configurable VRF parameters (can be updated later if needed)
        vrfSubscriptionId = _subscriptionId;
        vrfKeyHash = _keyHash;
    }

    // =========================================================================
    // HELPER FUNCTIONS - Internal prize calculation
    // =========================================================================

    /**
     * Calculate tiered prize distribution
     *
     * Distribution Logic:
     * - 40% → 1st place winner
     * - 30% → Next 4 winners (2nd-5th place, split equally = 7.5% each)
     * - 30% → Remaining winners (6th onwards, split equally)
     *
     * Edge Cases:
     * - 1 winner: Gets 100% of prize pool
     * - 2-5 winners: 1st gets 40%, rest share 60% equally
     * - 6+ winners: Full 3-tier distribution
     *
     * @param totalPrizePool Total amount available for winners (95% of pool)
     * @param numWinners Total number of winners selected
     * @return prizes Array of prize amounts for each winner (in USDC smallest unit)
     */
    function _calculateTieredPrizes(
        uint256 totalPrizePool,
        uint256 numWinners
    ) internal pure returns (uint256[] memory prizes) {
        require(numWinners > 0 && numWinners <= MAX_WINNERS, "Invalid winner count");

        prizes = new uint256[](numWinners);

        if (numWinners == 1) {
            // Single winner gets everything
            prizes[0] = totalPrizePool;
            return prizes;
        }

        // Tier 1: 1st place gets 40%
        uint256 tier1Amount = (totalPrizePool * 40) / 100;
        prizes[0] = tier1Amount;

        if (numWinners <= 5) {
            // Only 2-5 winners total
            // Remaining winners share 60% equally
            uint256 remaining = totalPrizePool - tier1Amount;
            uint256 perWinner = remaining / (numWinners - 1);

            for (uint256 i = 1; i < numWinners; i++) {
                prizes[i] = perWinner;
            }
        } else {
            // 6+ winners: Use full 3-tier distribution

            // Tier 2: Next 4 winners (positions 2-5) share 30%
            uint256 tier2Total = (totalPrizePool * 30) / 100;
            uint256 tier2PerWinner = tier2Total / 4;

            for (uint256 i = 1; i <= 4; i++) {
                prizes[i] = tier2PerWinner;
            }

            // Tier 3: Remaining winners share 30%
            uint256 tier3Total = (totalPrizePool * 30) / 100;
            uint256 tier3Count = numWinners - 5; // Remaining after top 5
            uint256 tier3PerWinner = tier3Total / tier3Count;

            for (uint256 i = 5; i < numWinners; i++) {
                prizes[i] = tier3PerWinner;
            }
        }

        return prizes;
    }

    /**
     * Select winners using VRF randomness with entry-based probability
     *
     * Winner Selection Logic:
     * - Each entry (ticket) has equal probability
     * - More entries = higher chance to win
     * - Each address can only win ONCE (uniqueness enforced)
     * - Uses Fisher-Yates shuffle with VRF randomness for fairness
     *
     * Example:
     * User A: 5 entries [0,1,2,3,4] → 50% chance (5/10)
     * User B: 2 entries [5,6]       → 20% chance (2/10)
     * User C: 1 entry [7]           → 10% chance (1/10)
     * User D: 2 entries [8,9]       → 20% chance (2/10)
     *
     * Random selection picks entry indices, not addresses
     * If an address is selected twice, skip to next unique address
     *
     * @param raffleId Raffle ID to select winners for
     * @param randomWord Random number from Chainlink VRF
     */
    function _selectWinners(
        uint256 raffleId,
        uint256 randomWord
    ) internal {
        Raffle storage raffle = raffles[raffleId];

        // Calculate number of winners based on percentage
        uint256 numWinners = (raffle.totalEntries * raffle.winnerPercent) / 100;

        // Cap at MAX_WINNERS (100)
        if (numWinners > MAX_WINNERS) {
            numWinners = MAX_WINNERS;
        }

        // Ensure at least 1 winner
        if (numWinners == 0) {
            numWinners = 1;
        }

        // Cannot have more winners than entries
        if (numWinners > raffle.totalEntries) {
            numWinners = raffle.totalEntries;
        }

        // Calculate prize pool (95% of total)
        uint256 totalPrizePool = (raffle.totalPool * MIN_WINNER_SHARE_PERCENT) / 100;

        // Calculate platform fee (5% of total)
        uint256 platformFee = raffle.totalPool - totalPrizePool;

        // Calculate individual prizes using tiered distribution
        uint256[] memory prizes = _calculateTieredPrizes(totalPrizePool, numWinners);

        // Select unique winners
        address[] memory winners = new address[](numWinners);
        uint256 winnersFound = 0;
        uint256 attempts = 0;
        uint256 maxAttempts = raffle.totalEntries * 2; // Safety limit

        // Use random word as seed for generating random indices
        uint256 seed = randomWord;

        while (winnersFound < numWinners && attempts < maxAttempts) {
            // Generate random entry index
            uint256 randomIndex = uint256(keccak256(abi.encode(seed, attempts))) % raffle.totalEntries;

            // Get winner address from entry index
            address winner = entryOwners[raffleId][randomIndex];

            // Check if this address already won (uniqueness check)
            if (!isWinner[raffleId][winner]) {
                // New winner found!
                winners[winnersFound] = winner;
                isWinner[raffleId][winner] = true;

                // Transfer prize to winner
                usdc.safeTransfer(winner, prizes[winnersFound]);

                winnersFound++;
            }

            attempts++;
        }

        // Store results
        raffleWinners[raffleId] = winners;
        rafflePrizes[raffleId] = prizes;
        raffle.numWinners = numWinners;
        raffle.state = RaffleState.Completed;

        // Add platform fee to accumulated fees
        protocolFeesCollected += platformFee;

        // Emit event with all winner data
        emit WinnersSelected(
            raffleId,
            winners,
            prizes,
            totalPrizePool,
            platformFee
        );
    }

    // =========================================================================
    // VRF CALLBACK - Called by Chainlink when random numbers are ready
    // =========================================================================

    /**
     * Callback function called by Chainlink VRF Coordinator
     *
     * SECURITY NOTE: Only the VRF Coordinator can call this function
     * This is enforced by VRFConsumerBaseV2 parent contract
     *
     * Flow:
     * 1. Chainlink generates random number off-chain
     * 2. Chainlink calls this function with the random number
     * 3. We use the random number to select winners
     * 4. Winners are paid immediately
     * 5. Raffle marked as completed
     *
     * @param requestId VRF request ID (used to match request to raffle)
     * @param randomWords Array of random numbers (we use first one)
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        // Get raffle ID from request ID
        uint256 raffleId = vrfRequestToRaffle[requestId];

        // Ensure raffle exists and is in drawing state
        Raffle storage raffle = raffles[raffleId];
        if (raffle.state != RaffleState.Drawing) revert InvalidState();

        // Select winners and distribute prizes
        _selectWinners(raffleId, randomWords[0]);
    }

    // =========================================================================
    // VIEW FUNCTIONS - Read-only functions for querying contract state
    // =========================================================================

    /**
     * Get all winners for a raffle
     * @param raffleId Raffle ID
     * @return Array of winner addresses
     */
    function getRaffleWinners(uint256 raffleId) external view returns (address[] memory) {
        return raffleWinners[raffleId];
    }

    /**
     * Get all prize amounts for a raffle
     * @param raffleId Raffle ID
     * @return Array of prize amounts (matches winner order)
     */
    function getRafflePrizes(uint256 raffleId) external view returns (uint256[] memory) {
        return rafflePrizes[raffleId];
    }

    /**
     * Check if an address won a specific raffle
     * @param raffleId Raffle ID
     * @param user User address
     * @return true if user won, false otherwise
     */
    function didUserWin(uint256 raffleId, address user) external view returns (bool) {
        return isWinner[raffleId][user];
    }

    // =========================================================================
    // NOTE: Additional functions not shown for brevity
    // =========================================================================
    // The following functions would be implemented in the complete contract:
    // - createRaffle() - Admin creates new raffle
    // - enterRaffle() - Users buy tickets
    // - triggerDraw() - Admin triggers winner selection
    // - cancelRaffle() - Admin cancels raffle (before draw)
    // - emergencyCancelDrawing() - Admin cancels stuck raffle (12h+ after draw)
    // - claimRefund() - Users claim refunds from cancelled raffle
    // - withdrawFees() - Admin withdraws platform fees
    // - pause/unpause() - Emergency pause functionality
    // - Admin setter functions for VRF config and limits
    //
    // These follow standard patterns and are straightforward implementations
    // of the business logic documented in the comments above.
    // =========================================================================
}
