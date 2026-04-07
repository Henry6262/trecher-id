/**
 * Scrape Axiom Pulse via Playwright using copied Chrome profile cookies.
 * Run: npx tsx scripts/scrape-axiom-cdp.ts
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const TEMP_PROFILE = '/tmp/brave-axiom-scrape';
const OUTPUT = path.join(__dirname, 'axiom-kols.json');

async function main() {
  console.log('Launching Chromium with copied Chrome profile...');

  const context = await chromium.launchPersistentContext(TEMP_PROFILE, {
    headless: false,
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    args: [
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
    viewport: { width: 1440, height: 900 },
    timeout: 60000,
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('Navigating to Axiom Pulse...');
    await page.goto('https://axiom.trade/pulse', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for page to actually render content
    console.log('Waiting for page content...');
    await page.waitForTimeout(5000);

    // Screenshot for debugging
    await page.screenshot({ path: path.join(__dirname, 'axiom-screenshot.png'), fullPage: false });
    console.log('Screenshot saved.');

    // Check if we're on the right page or got redirected to login
    const url = page.url();
    console.log('Current URL:', url);

    const title = await page.title();
    console.log('Page title:', title);

    // Dump page text to see what we're working with
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 3000) || 'empty');
    console.log('\n--- Page text (first 3000 chars) ---');
    console.log(bodyText);
    console.log('--- End ---\n');

    // If we need to log in, wait for the user
    if (url.includes('login') || url.includes('connect') || bodyText.includes('Connect Wallet')) {
      console.log('\n⚠️  Axiom needs login. Waiting 45s — please log in in the browser window...');
      await page.waitForTimeout(45000);
      await page.screenshot({ path: path.join(__dirname, 'axiom-after-login.png') });
    }

    // Now try to scrape — intercept API calls
    const apiResponses: any[] = [];
    page.on('response', async (response) => {
      const u = response.url();
      if (u.includes('axiom.trade') && u.includes('api')) {
        try {
          const ct = response.headers()['content-type'] || '';
          if (ct.includes('json')) {
            const json = await response.json();
            apiResponses.push({ url: u.split('?')[0], data: json });
            console.log(`  API intercepted: ${u.split('?')[0]}`);
          }
        } catch {}
      }
    });

    // Scroll and interact to trigger data loading
    console.log('Scrolling to load more data...');
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(1500);
    }

    // Scroll back up and try clicking tabs/filters if they exist
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Try clicking "Top Traders" or similar tabs
    const tabSelectors = [
      'text=Top Traders', 'text=Leaderboard', 'text=PNL',
      'text=Top', '[data-tab="traders"]', '[role="tab"]',
    ];
    for (const sel of tabSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 })) {
          console.log(`Clicking: ${sel}`);
          await el.click();
          await page.waitForTimeout(3000);
          break;
        }
      } catch {}
    }

    // More scrolling after tab click
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(1000);
    }

    // Now scrape everything we can from the DOM
    console.log('\nScraping DOM...');
    const scraped = await page.evaluate(() => {
      const results: any[] = [];

      // Method 1: Find all links that look like wallet addresses
      document.querySelectorAll('a').forEach(a => {
        const href = a.href;
        // Axiom wallet links: /m/WALLET_ADDRESS or /wallet/ADDRESS
        const match = href.match(/\/(m|wallet)\/([1-9A-HJ-NP-Za-km-z]{32,44})/);
        if (match) {
          const parent = a.closest('tr, [class*="row"], [class*="card"], [class*="item"], div') || a.parentElement;
          results.push({
            wallet: match[2],
            text: a.textContent?.trim() || '',
            context: parent?.textContent?.trim()?.substring(0, 300) || '',
            source: 'link',
          });
        }
      });

      // Method 2: Find any text that looks like a Solana address
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent || '';
        const addrMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
        if (addrMatch) {
          for (const addr of addrMatch) {
            if (addr.length >= 32 && addr.length <= 44) {
              const parent = (node as any).parentElement;
              const grandparent = parent?.closest('tr, [class*="row"], [class*="card"]') || parent?.parentElement;
              results.push({
                wallet: addr,
                text: parent?.textContent?.trim()?.substring(0, 100) || '',
                context: grandparent?.textContent?.trim()?.substring(0, 300) || '',
                source: 'text',
              });
            }
          }
        }
      }

      return results;
    });

    console.log(`DOM scrape found ${scraped.length} wallet references`);

    // Deduplicate by wallet
    const walletMap = new Map<string, any>();
    for (const item of scraped) {
      if (!walletMap.has(item.wallet)) {
        walletMap.set(item.wallet, item);
      }
    }

    const unique = Array.from(walletMap.values());
    console.log(`Unique wallets: ${unique.length}`);

    // Save everything
    const output = {
      apiResponses,
      domScraped: unique,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
    console.log(`\nSaved to ${OUTPUT}`);

    // Print wallets
    for (const item of unique.slice(0, 20)) {
      console.log(`  ${item.wallet.slice(0, 12)}... | ${item.text.slice(0, 40)}`);
    }
    if (unique.length > 20) console.log(`  ... and ${unique.length - 20} more`);

    // Final screenshot
    await page.screenshot({ path: path.join(__dirname, 'axiom-final.png'), fullPage: true });

  } catch (err) {
    console.error('Error:', err);
    await page.screenshot({ path: path.join(__dirname, 'axiom-error.png') }).catch(() => {});
  } finally {
    await context.close();
  }
}

main().catch(console.error);
