/**
 * Scrape top traders from Axiom Pulse leaderboard using Playwright.
 *
 * Uses your local Chrome profile (where you're logged into Axiom) to bypass auth.
 * Extracts: wallet address, display name, PnL, wins/losses, Twitter handle.
 *
 * Run: npx playwright test scripts/scrape-axiom.ts --headed
 * Or:  npx tsx scripts/scrape-axiom.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const CHROME_USER_DATA = path.join(
  process.env.HOME || '/Users/henry',
  'Library/Application Support/Google/Chrome'
);

const TARGET_COUNT = 60; // scrape more than 50 to account for dupes with existing seed
const OUTPUT_FILE = path.join(__dirname, 'axiom-kols.json');

// Existing wallets from seed.ts — skip these
const EXISTING_WALLETS = new Set([
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o',
  '5hAgYC8TJCcEZV7LTXAzkTrm7YL29YXyQQJPCNrG84zM',
  'Bi4rd5FH5bYEN8scZ7wevxNZyNmKHdaBcvewdPFxYdLt',
  '6TAHDM5Tod7dBTZdYQxzgJZKxxPfiNV9udPHMiUNumyK',
  '78N177fzNJpp8pG49xDv1efYcTMSzo9tPTKEA9mAVkh2',
  'JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN',
  '3BLjRcxWGtR7WRshJ3hL25U3RjWr5Ud98wMcczQqk4Ei',
  'UxuuMeyX2pZPHmGZ2w3Q8MysvExCAquMtvEfqp2etvm',
  '2X4H5Y9C4Fy6Pf3wpq8Q4gMvLcWvfrrwDv2bdR8AAwQv',
  'BCagckXeMChUKrHEd6fKFA1uiWDtcmCXMsqaheLiUPJd',
  '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9',
  'AstaWuJuQiAS3AfqmM3xZxrJhkkZNXtW4VyaGQfqV6JL',
  'B32QbbdDAyhvUQzjcaM5j6ZVKwjCxAwGH5Xgvb9SJqnC',
  'J6TDXvarvpBdPXTaTU8eJbtso1PUCYKGkVtMKUUY8iEa',
  'LeenseyyUU3ccdBPCFCrrZ8oKU2B3T2uToGGZ7eVABY',
  'EP5mvfhGv6x1XR33Fd8eioiYjtRXAawafPmkz9xBpDvG',
  '3bzaJd5yZG73EVDz8xosQb7gfZm2LN5auFGh6wnP1n1f',
  '6S8GezkxYUfZy9JPtYnanbcZTMB87Wjt1qx3c6ELajKC',
  'ASVzakePP6GNg9r95d4LPZHJDMXun6L6E4um4pu5ybJk',
  '2net6etAtTe3Rbq2gKECmQwnzcKVXRaLcHy2Zy1iCiWz',
  'CEUA7zVoDRqRYoeHTP58UHU6TR8yvtVbeLrX1dppqoXJ',
  '67Nwfi9hgwqhxGoovT2JGLU67uxfomLwQAWncjXXzU6U',
  'J9TYAsWWidbrcZybmLSfrLzryANf4CgJBLdvwdGuC8MB',
  'JBrYniqfp9ZVWdrkhMEX2LNGBpYJ673Tzh2m3XsS14p7',
  '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP',
  '5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X',
  'H31vEBxSJk1nQdUN11qZgZyhScyShhscKhvhZZU3dQoU',
  '4JyenL2p8eQZAQuRS8QAASy7TzEcqAeKGha6bhiJXudh',
  '831yhv67QpKqLBJjbmw2xoDUeeFHGUx8RnuRj9imeoEs',
  '9FNz4MjPUmnJqTf6yEDbL1D4SsHVh7uA8zRHhR5K138r',
  '6EDaVsS6enYgJ81tmhEkiKFcb4HuzPUVFZeom6PHUqN3',
  'FsG3BaPmRTdSrPaivbgJsFNCCa8cPfkUtk8VLWXkHpHP',
  '3wjyaSegfV7SZzjv9Ut1p6AcY5ZdoZjmu6i6QPCVvnmz',
  'B3JyPD3t9ufZWfL3namyvoc258KH74JojSxxurUg9jCT',
  'FqamE7xrahg7FEWoByrx1o8SeyHt44rpmE6ZQfT7zrve',
  'PMJA8UQDyWTFw2Smhyp9jGA6aTaP7jKHR7BPudrgyYN',
  'G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC',
  '6mWEJG9LoRdto8TwTdZxmnJpkXpTsEerizcGiCNZvzXd',
  'GfXQesPe3Zuwg8JhAt6Cg8euJDTVx751enp9EQQmhzPH',
  'DNsh1UfJdxmze6T6GV9QK5SoFm7HsM5TRNxVuwVgo8Zj',
  '4fZFcK8ms3bFMpo1ACzEUz8bH741fQW4zhAMGd5yZMHu',
  '99xnE2zEFi8YhmKDaikc1EvH6ELTQJppnqUwMzmpLXrs',
  '4xY9T1Q7foJzJsJ6YZDSsfp9zkzeZsXnxd45SixduMmr',
  'gangJEP5geDHjPVRhDS5dTF5e6GtRvtNogMEEVs91RV',
  '4nvNc7dDEqKKLM4Sr9Kgk3t1of6f8G66kT64VoC95LYh',
]);

interface TraderData {
  name: string;
  wallet: string;
  twitter?: string;
  pnlSol: number;
  wins: number;
  losses: number;
  totalTrades: number;
  winRate: number;
}

interface ApiCapture {
  url: string;
  data: unknown;
}

interface DomTraderCandidate {
  name: string;
  wallet: string;
  pnlText: string;
  html?: string;
  source?: string;
}

async function scrapeAxiomPulse(): Promise<TraderData[]> {
  console.log('Launching Chrome with your profile (for Axiom auth)...');

  // Launch with persistent context to use existing Chrome cookies
  const context = await chromium.launchPersistentContext(
    path.join(CHROME_USER_DATA, 'Default'),
    {
      headless: false,
      channel: 'chrome',
      args: [
        '--no-first-run',
        '--disable-blink-features=AutomationControlled',
      ],
      viewport: { width: 1440, height: 900 },
    }
  );

  const page = context.pages()[0] || await context.newPage();
  const traders: TraderData[] = [];

  try {
    // Navigate to Axiom Pulse (leaderboard)
    console.log('Navigating to Axiom Pulse...');
    await page.goto('https://axiom.trade/pulse', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check if we need to log in
    const pageContent = await page.content();
    if (pageContent.includes('Connect') && !pageContent.includes('pulse')) {
      console.log('⚠️  Not logged in. Please log in manually in the browser window...');
      console.log('   Waiting up to 60s for login...');
      await page.waitForURL('**/pulse**', { timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }

    console.log('On Axiom Pulse page. Scraping traders...');

    // Try to extract data from the page via network interception + DOM scraping
    // Axiom loads trader data via API calls — intercept them
    const apiData: ApiCapture[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') && (url.includes('leaderboard') || url.includes('rank') || url.includes('pulse') || url.includes('trader'))) {
        try {
          const json = await response.json();
          apiData.push({ url, data: json });
          console.log(`  Intercepted API: ${url.split('?')[0]}`);
        } catch {}
      }
    });

    // Scroll down to load more traders
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(1500);
    }

    // Scrape trader rows from the DOM
    const domTraders = await page.evaluate<DomTraderCandidate[]>(() => {
      const results: DomTraderCandidate[] = [];

      // Look for trader cards/rows — Axiom uses various selectors
      // Try common patterns for leaderboard tables
      const rows = document.querySelectorAll('[class*="trader"], [class*="row"], [class*="card"], tr[data-wallet], [data-address]');

      rows.forEach(row => {
        const wallet = row.getAttribute('data-wallet') || row.getAttribute('data-address') || '';
        const nameEl = row.querySelector('[class*="name"], [class*="username"], a[href*="/wallet/"]');
        const pnlEl = row.querySelector('[class*="pnl"], [class*="profit"]');

        if (wallet || nameEl) {
          results.push({
            name: nameEl?.textContent?.trim() || '',
            wallet: wallet || (nameEl as HTMLAnchorElement)?.href?.match(/\/wallet\/([A-Za-z0-9]+)/)?.[1] || '',
            pnlText: pnlEl?.textContent?.trim() || '',
            html: row.innerHTML.substring(0, 500),
          });
        }
      });

      // Also look for links containing wallet addresses
      const walletLinks = document.querySelectorAll('a[href*="/m/"]');
      walletLinks.forEach(link => {
        const href = (link as HTMLAnchorElement).href;
        const walletMatch = href.match(/\/m\/([1-9A-HJ-NP-Za-km-z]{32,44})/);
        if (walletMatch) {
          const parent = link.closest('[class*="row"], [class*="card"], tr, div[class*="item"]') || link.parentElement;
          results.push({
            name: link.textContent?.trim() || '',
            wallet: walletMatch[1],
            pnlText: parent?.textContent?.trim()?.substring(0, 200) || '',
            source: 'wallet-link',
          });
        }
      });

      return results;
    });

    console.log(`\nDOM scrape found ${domTraders.length} potential traders`);
    if (apiData.length > 0) {
      console.log(`API interception caught ${apiData.length} responses`);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: path.join(__dirname, 'axiom-pulse-screenshot.png'), fullPage: true });
    console.log('Screenshot saved to scripts/axiom-pulse-screenshot.png');

    // Also dump the full page text for analysis
    const fullText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(__dirname, 'axiom-pulse-text.txt'), fullText);
    console.log('Page text saved to scripts/axiom-pulse-text.txt');

    // Save raw scraped data for manual review
    fs.writeFileSync(
      path.join(__dirname, 'axiom-raw-scrape.json'),
      JSON.stringify({ domTraders, apiData }, null, 2)
    );
    console.log('Raw scrape data saved to scripts/axiom-raw-scrape.json');

    // Process whatever we found
    for (const t of domTraders) {
      if (!t.wallet || t.wallet.length < 32 || EXISTING_WALLETS.has(t.wallet)) continue;

      const pnlMatch = t.pnlText?.match(/([\d,.]+)\s*SOL/i);
      const pnlSol = pnlMatch ? parseFloat(pnlMatch[1].replace(/,/g, '')) : 0;

      traders.push({
        name: t.name || t.wallet.slice(0, 8),
        wallet: t.wallet,
        twitter: undefined,
        pnlSol,
        wins: 0,
        losses: 0,
        totalTrades: 0,
        winRate: 0,
      });
    }

  } catch (err) {
    console.error('Scraping error:', err);
    // Save screenshot on error too
    await page.screenshot({ path: path.join(__dirname, 'axiom-error-screenshot.png') }).catch(() => {});
  } finally {
    await context.close();
  }

  return traders;
}

async function enrichWithFxTwitter(traders: TraderData[]): Promise<TraderData[]> {
  // Try to find Twitter handles for traders via their Axiom profiles or fxtwitter reverse lookup
  // This is a best-effort enrichment step
  console.log(`\nEnriching ${traders.length} traders with Twitter data...`);
  // For now, return as-is — Twitter enrichment happens during seed via unavatar
  return traders;
}

async function main() {
  console.log('=== Axiom Pulse Scraper ===\n');

  let traders = await scrapeAxiomPulse();

  // Deduplicate by wallet
  const seen = new Set<string>();
  traders = traders.filter(t => {
    if (seen.has(t.wallet)) return false;
    seen.add(t.wallet);
    return true;
  });

  console.log(`\n=== Found ${traders.length} new unique traders ===`);

  if (traders.length > 0) {
    traders = await enrichWithFxTwitter(traders);

    // Sort by PnL descending
    traders.sort((a, b) => b.pnlSol - a.pnlSol);

    // Take top TARGET_COUNT
    const final = traders.slice(0, TARGET_COUNT);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(final, null, 2));
    console.log(`\nSaved ${final.length} traders to ${OUTPUT_FILE}`);

    // Print summary
    for (const t of final.slice(0, 10)) {
      console.log(`  ${t.name.padEnd(20)} ${t.wallet.slice(0, 8)}... ${t.pnlSol} SOL`);
    }
    if (final.length > 10) console.log(`  ... and ${final.length - 10} more`);
  } else {
    console.log('\n⚠️  No traders scraped. Check the screenshots and raw data for debugging.');
    console.log('   The page structure may need manual inspection.');
  }
}

main().catch(console.error);
