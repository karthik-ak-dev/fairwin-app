'use client';

import './Home.styles.css';
import { useRaffles } from '@/lib/hooks/raffle/raffle-query.hooks';
import { usePlatformStats } from '@/lib/hooks/shared/platform-stats.hooks';
import { RaffleStatus } from '@/lib/db/models';

export default function Home() {
  const { data: rafflesData } = useRaffles({ status: RaffleStatus.ACTIVE });
  const { data: statsData } = usePlatformStats();

  const activeRaffles = rafflesData?.raffles || [];
  const stats = statsData?.stats;

  return (
    <div className="home">
      {/* Navigation */}
      <nav className="nav">
        <div className="container">
          <div className="logo">
            FAIR<span>WIN</span>
          </div>
          <div className="nav-links">
            <a href="#games">Games</a>
            <a href="#live">Live</a>
            <a href="#verify">Verify</a>
            <button className="btn-nav">Connect</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">5 Games Live Now</div>
            <h1>
              <div className="line1">100% On-Chain.</div>
              <div className="line2">100% Verifiable.</div>
            </h1>
            <p className="hero-sub">
              Every bet, every outcome, every payout on the blockchain. Verify it yourself on Polygonscan.
            </p>
            <div className="hero-cta">
              <button className="btn-hero">Play Now</button>
              <a href="#" className="link-hero">
                How It Works →
              </a>
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value accent">$1.5M+</div>
              <div className="hero-stat-label">Total Paid Out</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">32K</div>
              <div className="hero-stat-label">Players</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">On-Chain</div>
            </div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="games" id="games">
        <div className="container">
          <div className="games-header">
            <div>
              <div className="section-label">Games</div>
              <h2 className="section-title">Choose Your Game</h2>
            </div>
          </div>
          <div className="games-grid">
            <div className="game-card">
              <div className="game-icon">🎟️</div>
              <div className="game-name">Raffle</div>
              <div className="game-desc">Win 90% of pool</div>
              <div className="game-stat">$14.8K</div>
              <div className="game-stat-label">Total Pools</div>
            </div>
            <div className="game-card">
              <div className="game-icon">🪙</div>
              <div className="game-name">Coinflip</div>
              <div className="game-desc">Instant 2x</div>
              <div className="game-stat">$42.3K</div>
              <div className="game-stat-label">24h Volume</div>
            </div>
            <div className="game-card">
              <div className="game-icon">🎲</div>
              <div className="game-name">Dice</div>
              <div className="game-desc">Up to 99x</div>
              <div className="game-stat">$38.1K</div>
              <div className="game-stat-label">24h Volume</div>
            </div>
            <div className="game-card">
              <div className="game-icon">🎱</div>
              <div className="game-name">Lottery</div>
              <div className="game-desc">Pick 6 numbers</div>
              <div className="game-stat">$52K</div>
              <div className="game-stat-label">Jackpot</div>
            </div>
            <div className="game-card">
              <div className="game-icon">📈</div>
              <div className="game-name">Crash</div>
              <div className="game-desc">Cash out anytime</div>
              <div className="game-stat">$67.4K</div>
              <div className="game-stat-label">24h Volume</div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Draws Section */}
      <section className="live-draws" id="live">
        <div className="container">
          <div className="draws-header">
            <div>
              <div className="section-label">Join Now</div>
              <h2 className="section-title">Active Draws</h2>
            </div>
            <div className="live-indicator">Live</div>
          </div>
          <div className="draws-list">
            <div className="draw-row">
              <div className="draw-icon">🎟️</div>
              <div className="draw-info">
                <div className="draw-name">Daily Raffle</div>
                <div className="draw-desc">Winner every 24 hours • 847 entries</div>
              </div>
              <div className="draw-pool">
                <div className="draw-pool-value">$2,450</div>
                <div className="draw-pool-label">Pool</div>
              </div>
              <div className="draw-time">
                <div className="draw-time-value">6h 24m</div>
                <div className="draw-time-label">Left</div>
              </div>
              <button className="draw-btn">Enter</button>
            </div>
            <div className="draw-row">
              <div className="draw-icon">🎟️</div>
              <div className="draw-info">
                <div className="draw-name">Weekly Raffle</div>
                <div className="draw-desc">Winner every Sunday • 2,340 entries</div>
              </div>
              <div className="draw-pool">
                <div className="draw-pool-value">$14,850</div>
                <div className="draw-pool-label">Pool</div>
              </div>
              <div className="draw-time">
                <div className="draw-time-value">2d 18h</div>
                <div className="draw-time-label">Left</div>
              </div>
              <button className="draw-btn">Enter</button>
            </div>
            <div className="draw-row">
              <div className="draw-icon">🎱</div>
              <div className="draw-info">
                <div className="draw-name">Monthly Lottery</div>
                <div className="draw-desc">Pick 6 numbers • 1,280 tickets sold</div>
              </div>
              <div className="draw-pool">
                <div className="draw-pool-value">$52,000</div>
                <div className="draw-pool-label">Jackpot</div>
              </div>
              <div className="draw-time">
                <div className="draw-time-value">12d 4h</div>
                <div className="draw-time-label">Left</div>
              </div>
              <button className="draw-btn">Buy</button>
            </div>
            <div className="draw-row">
              <div className="draw-icon">🎟️</div>
              <div className="draw-info">
                <div className="draw-name">Mega Raffle</div>
                <div className="draw-desc">Monthly grand prize • 4,560 entries</div>
              </div>
              <div className="draw-pool">
                <div className="draw-pool-value">$48,200</div>
                <div className="draw-pool-label">Pool</div>
              </div>
              <div className="draw-time">
                <div className="draw-time-value">18d 2h</div>
                <div className="draw-time-label">Left</div>
              </div>
              <button className="draw-btn">Enter</button>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Payouts Section */}
      <section className="earnings">
        <div className="container">
          <div className="draws-header">
            <div>
              <div className="section-label">Verified Wins</div>
              <h2 className="section-title">Real-Time Payouts</h2>
            </div>
            <div className="live-indicator">Live Feed</div>
          </div>
          <div className="earnings-grid">
            <div className="earnings-list">
              <div className="earning-item">
                <span className="earning-icon">🎟️</span>
                <div className="earning-info">
                  <div className="earning-game">Daily Raffle Winner</div>
                  <div className="earning-address">0x7a3F...9c2E</div>
                </div>
                <span className="earning-amount">+$2,216</span>
                <a href="#" className="earning-verify">
                  Verify →
                </a>
              </div>
              <div className="earning-item">
                <span className="earning-icon">📈</span>
                <div className="earning-info">
                  <div className="earning-game">Crash — Cashed at 4.2x</div>
                  <div className="earning-address">0x2eB1...4f8A</div>
                </div>
                <span className="earning-amount">+$840</span>
                <a href="#" className="earning-verify">
                  Verify →
                </a>
              </div>
              <div className="earning-item">
                <span className="earning-icon">🪙</span>
                <div className="earning-info">
                  <div className="earning-game">Coinflip — Heads</div>
                  <div className="earning-address">0x9cD4...7b3F</div>
                </div>
                <span className="earning-amount">+$500</span>
                <a href="#" className="earning-verify">
                  Verify →
                </a>
              </div>
              <div className="earning-item">
                <span className="earning-icon">🎲</span>
                <div className="earning-info">
                  <div className="earning-game">Dice — Rolled 23</div>
                  <div className="earning-address">0x4fA1...2e8C</div>
                </div>
                <span className="earning-amount">+$1,200</span>
                <a href="#" className="earning-verify">
                  Verify →
                </a>
              </div>
              <div className="earning-item">
                <span className="earning-icon">🎱</span>
                <div className="earning-info">
                  <div className="earning-game">Lottery — 4 matches</div>
                  <div className="earning-address">0x8bE2...1a9D</div>
                </div>
                <span className="earning-amount">+$2,500</span>
                <a href="#" className="earning-verify">
                  Verify →
                </a>
              </div>
            </div>
            <div className="earnings-stats">
              <div className="e-stat">
                <div className="e-stat-value">$1.5M+</div>
                <div className="e-stat-label">Total Paid</div>
              </div>
              <div className="e-stat">
                <div className="e-stat-value">4,230</div>
                <div className="e-stat-label">Games Today</div>
              </div>
              <div className="e-stat">
                <div className="e-stat-value">Instant</div>
                <div className="e-stat-label">Payouts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verify Section */}
      <section className="verify" id="verify">
        <div className="container">
          <div className="draws-header">
            <div>
              <div className="section-label">Transparency</div>
              <h2 className="section-title">Don't Trust. Verify.</h2>
            </div>
          </div>
          <div className="verify-list">
            <div className="verify-item">
              <div className="verify-num">01</div>
              <div className="verify-content">
                <h4>Find the Transaction</h4>
                <p>
                  Every bet creates a transaction on Polygon. Find it on Polygonscan using your wallet or the game's
                  transaction hash.
                </p>
                <a href="#" className="verify-link">
                  Open Polygonscan →
                </a>
              </div>
            </div>
            <div className="verify-item">
              <div className="verify-num">02</div>
              <div className="verify-content">
                <h4>Check the VRF Proof</h4>
                <p>
                  Each game shows the Chainlink VRF request. Cryptographic proof the randomness wasn't manipulated.
                </p>
                <a href="#" className="verify-link">
                  What is Chainlink VRF? →
                </a>
              </div>
            </div>
            <div className="verify-item">
              <div className="verify-num">03</div>
              <div className="verify-content">
                <h4>Trace the Outcome</h4>
                <p>The smart contract logic is public. Trace exactly how the random number determined the winner.</p>
                <a href="#" className="verify-link">
                  View Contract Code →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Difference Section */}
      <section className="difference">
        <div className="container">
          <div className="draws-header">
            <div>
              <div className="section-label">The Difference</div>
              <h2 className="section-title">Why This Matters</h2>
            </div>
          </div>
          <div className="diff-grid">
            <div className="diff-col them">
              <h3>🎰 Traditional Casinos</h3>
              <div className="diff-list">
                <div className="diff-item">
                  <span className="icon">✗</span> Bets stored in their database
                </div>
                <div className="diff-item">
                  <span className="icon">✗</span> Verification only on their website
                </div>
                <div className="diff-item">
                  <span className="icon">✗</span> Server RNG — hidden, unverifiable
                </div>
                <div className="diff-item">
                  <span className="icon">✗</span> Custodial — they hold your funds
                </div>
                <div className="diff-item">
                  <span className="icon">✗</span> Manual withdrawal approval
                </div>
                <div className="diff-item">
                  <span className="icon">✗</span> Can ban/limit winners
                </div>
              </div>
            </div>
            <div className="diff-col us">
              <h3>⚡ FairWin</h3>
              <div className="diff-list">
                <div className="diff-item">
                  <span className="icon">✓</span> Bets recorded on blockchain
                </div>
                <div className="diff-item">
                  <span className="icon">✓</span> Verify on Polygonscan (independent)
                </div>
                <div className="diff-item">
                  <span className="icon">✓</span> Chainlink VRF — provable randomness
                </div>
                <div className="diff-item">
                  <span className="icon">✓</span> Non-custodial — smart contract holds
                </div>
                <div className="diff-item">
                  <span className="icon">✓</span> Instant automatic payouts
                </div>
                <div className="diff-item">
                  <span className="icon">✓</span> Permissionless — no bans possible
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="container">
          <div className="draws-header">
            <div>
              <div className="section-label">FAQ</div>
              <h2 className="section-title">Questions</h2>
            </div>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-q">Why only 5 games?</div>
              <p className="faq-a">
                We only offer games that work 100% on-chain. Slots require off-chain servers — that defeats the purpose
                of transparency.
              </p>
            </div>
            <div className="faq-item">
              <div className="faq-q">What is Chainlink VRF?</div>
              <p className="faq-a">
                A cryptographic system that generates random numbers with mathematical proof they weren't manipulated.
                Used by major DeFi protocols.
              </p>
            </div>
            <div className="faq-item">
              <div className="faq-q">Can you rig the outcomes?</div>
              <p className="faq-a">
                No. Randomness comes from Chainlink after you bet. We can't predict or change it. The math proves this.
              </p>
            </div>
            <div className="faq-item">
              <div className="faq-q">What if FairWin disappears?</div>
              <p className="faq-a">
                The smart contract keeps running. You can interact directly via Polygonscan to withdraw or play.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>
            Ready to <span>Play Fair?</span>
          </h2>
          <p>Connect your wallet. Pick a game. Verify everything.</p>
          <button className="btn-hero">Connect Wallet</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <a href="#">Contract</a>
            <a href="#">GitHub</a>
            <a href="#">Docs</a>
            <a href="#">Twitter</a>
          </div>
          <div className="footer-copy">© 2026 FairWin</div>
        </div>
      </footer>
    </div>
  );
}
