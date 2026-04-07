/**
 * Collect trader data from Axiom Vision leaderboard.
 * Uses real Brave profile for auth. Brave must be closed before running.
 *
 * Run: npx tsx scripts/axiom-vision.ts
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BRAVE_PROFILE = path.join(
  process.env.HOME || '/Users/henry',
  'Library/Application Support/BraveSoftware/Brave-Browser'
);
const BRAVE_BIN = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const OUTPUT = path.join(__dirname, 'axiom-vision-data.json');

interface TraderRow {
  rank: number;
  name: string;
  wallet: string | null;
  pnlSol: number;
  winRate: number;
  positions: number;
  trades: number;
  volume: number;
  avgHold: string;
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Launching Brave with your real profile...');

  const context = await chromium.launchPersistentContext(BRAVE_PROFILE, {
    executablePath: BRAVE_BIN,
    headless: false,
    args: [
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
      '--profile-directory=Default',
    ],
    viewport: { width: 1440, height: 900 },
    timeout: 30000,
  });

  const page = context.pages()[0] || await context.newPage();
  const traders: TraderRow[] = [];

  try {
    // Go to Vision leaderboard
    console.log('Opening Axiom Vision...');
    await page.goto('https://axiom.trade/vision?chain=sol', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await sleep(5000);

    const pageUrl = page.url();
    console.log('URL:', pageUrl);

    // Check if logged in
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
    if (bodyText.includes('Session invalid') || bodyText.includes('please login')) {
      console.log('⚠️  Not logged in — waiting 60s, please log in manually...');
      await sleep(60000);
    }

    // Screenshot to see what we're working with
    await page.screenshot({ path: path.join(__dirname, 'vision-initial.png') });
    console.log('Initial screenshot saved.');

    // Scroll down to load all traders in the leaderboard
    console.log('Scrolling to load traders...');
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await sleep(1000);
    }
    await sleep(2000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1000);

    await page.screenshot({ path: path.join(__dirname, 'vision-loaded.png'), fullPage: true });
    console.log('Full page screenshot saved.');

    // Extract all clickable profile links from the leaderboard
    console.log('Finding trader profile links...');
    const profileLinks = await page.evaluate(() => {
      const links: { href: string; text: string }[] = [];
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || '';
        // Axiom profile links typically contain wallet addresses or user IDs
        if (href.includes('/profile/') || href.includes('/trader/') ||
            href.includes('/user/') || href.includes('/m/') ||
            href.match(/\/[1-9A-HJ-NP-Za-km-z]{32,44}/)) {
          links.push({ href, text: a.textContent?.trim()?.substring(0, 50) || '' });
        }
      });
      return links;
    });

    console.log(`Found ${profileLinks.length} profile links`);
    for (const l of profileLinks.slice(0, 5)) {
      console.log(`  ${l.text} -> ${l.href}`);
    }

    // Also dump the full page text to find patterns
    const fullText = await page.evaluate(() => document.body?.innerText || '');
    fs.writeFileSync(path.join(__dirname, 'vision-text.txt'), fullText);
    console.log('Page text saved to vision-text.txt');

    // Try to find trader rows and click into each one
    // First, let's identify the structure by looking at what's on the page
    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({ href: a.getAttribute('href')!, text: (a.textContent || '').trim().substring(0, 60) }))
        .filter(l => l.href && !l.href.startsWith('javascript') && !l.href.includes('twitter') && !l.href.includes('discord'));
    });

    // Find unique link patterns
    const patterns = new Map<string, number>();
    for (const l of allLinks) {
      const parts = l.href.split('/');
      const pattern = parts.map(p => p.match(/^[1-9A-HJ-NP-Za-km-z]{20,}$/) ? '{ID}' : p).join('/');
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    console.log('\nLink patterns found:');
    for (const [pattern, count] of Array.from(patterns.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`  ${count}x ${pattern}`);
    }

    // Now click into each trader profile to get wallet addresses
    // Filter for links that look like trader profiles
    const traderLinks = allLinks.filter(l => {
      const href = l.href;
      return (href.includes('/profile/') || href.includes('/trader/') ||
              href.includes('/user/') || href.includes('/m/') ||
              href.match(/\/[1-9A-HJ-NP-Za-km-z]{32,44}/)) &&
             !href.includes('docs') && !href.includes('rewards');
    });

    if (traderLinks.length === 0) {
      // Try clicking on trader names/rows directly
      console.log('\nNo direct profile links found. Trying to click trader rows...');

      // Get all clickable elements that might be trader entries
      const clickableTraders = await page.evaluate(() => {
        const results: { selector: string; text: string }[] = [];
        // Look for elements with trader names
        const elements = document.querySelectorAll('[class*="cursor-pointer"], [role="row"], tr, [class*="trader"], [class*="row"]');
        elements.forEach((el, i) => {
          const text = el.textContent?.trim()?.substring(0, 100) || '';
          if (text && (text.includes('+') || text.includes('%')) && text.length > 10) {
            results.push({ selector: `[data-idx="${i}"]`, text });
            el.setAttribute('data-idx', String(i));
          }
        });
        return results;
      });

      console.log(`Found ${clickableTraders.length} potential trader rows`);
      for (const t of clickableTraders.slice(0, 3)) {
        console.log(`  ${t.text.substring(0, 80)}`);
      }
    }

    // Click the first trader to understand the profile page structure
    if (traderLinks.length > 0) {
      console.log(`\nClicking ${Math.min(60, traderLinks.length)} trader profiles...`);

      for (let i = 0; i < Math.min(60, traderLinks.length); i++) {
        const link = traderLinks[i];
        try {
          console.log(`  [${i + 1}] ${link.text}...`);
          await page.goto(`https://axiom.trade${link.href.startsWith('/') ? link.href : '/' + link.href}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          });
          await sleep(3000);

          // Extract wallet from URL or page content
          const profileUrl = page.url();
          const walletFromUrl = profileUrl.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0] || null;

          // Also check page content for wallet
          const profileText = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
          const walletFromPage = !walletFromUrl ?
            profileText.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0] || null :
            walletFromUrl;

          traders.push({
            rank: i + 1,
            name: link.text || `Trader ${i + 1}`,
            wallet: walletFromPage,
            pnlSol: 0, // Will parse from leaderboard data
            winRate: 0,
            positions: 0,
            trades: 0,
            volume: 0,
            avgHold: '',
          });

          if (walletFromPage) {
            console.log(`    ✓ wallet: ${walletFromPage.slice(0, 12)}...`);
          } else {
            console.log(`    ✗ no wallet found`);
          }

          // Go back
          await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
          await sleep(2000 + Math.random() * 2000); // Random delay 2-4s
        } catch (err) {
          console.log(`    ✗ error: ${String(err).substring(0, 80)}`);
        }
      }
    } else {
      // Try a different approach — click directly on names
      console.log('\nTrying direct click approach on leaderboard names...');

      const nameElements = await page.$$('text=Noir, text=Trenchman, text=Jack Duval');
      console.log(`Found ${nameElements.length} name elements`);

      // Just try clicking the first visible trader name
      const firstTrader = page.locator('a:has-text("Noir")').first();
      if (await firstTrader.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Clicking "Noir"...');
        await firstTrader.click();
        await sleep(3000);
        const url = page.url();
        console.log('Profile URL:', url);
        const wallet = url.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0];
        console.log('Wallet:', wallet || 'not in URL');

        await page.screenshot({ path: path.join(__dirname, 'vision-profile.png') });
        console.log('Profile screenshot saved.');

        const profileText = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
        fs.writeFileSync(path.join(__dirname, 'vision-profile-text.txt'), profileText);
        console.log('Profile text saved.');
      }
    }

    // Save results
    fs.writeFileSync(OUTPUT, JSON.stringify(traders, null, 2));
    console.log(`\nSaved ${traders.length} traders to ${OUTPUT}`);

  } catch (err) {
    console.error('Error:', err);
    await page.screenshot({ path: path.join(__dirname, 'vision-error.png') }).catch(() => {});
  } finally {
    await context.close();
  }
}

main().catch(console.error);
