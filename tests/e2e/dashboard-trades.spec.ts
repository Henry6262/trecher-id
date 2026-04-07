import { expect, test } from '@playwright/test';
import { createTestSession, uniqueUsername } from './helpers';

test('dashboard trades page supports pinning and unpinning with mocked trade data', async ({ page }) => {
  await createTestSession(page, {
    username: uniqueUsername('trades'),
    displayName: 'Trade Pinner',
  });

  const walletAddress = '11111111111111111111111111111111';
  let pinned = [
    {
      id: 'pin_1',
      tokenMint: 'mint_existing',
      tokenSymbol: 'BONK',
      tokenName: 'Bonk',
      walletAddress,
      totalPnlPercent: 42.5,
      totalPnlSol: 1.234,
      transactions: [
        { type: 'BUY', amountSol: 0.5, mcap: 0, timestamp: 1700000000 },
        { type: 'SELL', amountSol: 1.734, mcap: 0, timestamp: 1700003600 },
      ],
    },
  ];

  const allTrades = [
    {
      tokenMint: 'mint_existing',
      tokenSymbol: 'BONK',
      tokenName: 'Bonk',
      walletAddress,
      transactions: [
        { type: 'BUY', amountSol: 0.5, mcap: 0, timestamp: 1700000000 },
        { type: 'SELL', amountSol: 1.734, mcap: 0, timestamp: 1700003600 },
      ],
      totalPnlSol: 1.234,
      totalPnlPercent: 42.5,
    },
    {
      tokenMint: 'mint_new',
      tokenSymbol: 'WIF',
      tokenName: 'dogwifhat',
      walletAddress,
      transactions: [
        { type: 'BUY', amountSol: 1.1, mcap: 0, timestamp: 1700100000 },
        { type: 'SELL', amountSol: 2.5, mcap: 0, timestamp: 1700107200 },
      ],
      totalPnlSol: 1.4,
      totalPnlPercent: 127.27,
    },
  ];

  await page.route('**/api/wallets', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'wallet_1', address: walletAddress, chain: 'solana', verified: true, linkedAt: new Date().toISOString() },
      ]),
    });
  });

  await page.route('**/api/trades', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(allTrades),
    });
  });

  await page.route('**/api/trades/pin', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pinned),
      });
      return;
    }

    if (method === 'POST') {
      const payload = JSON.parse(route.request().postData() ?? '{}');
      const created = {
        id: `pin_${pinned.length + 1}`,
        tokenMint: payload.tokenMint,
        tokenSymbol: payload.tokenSymbol,
        tokenName: payload.tokenName,
        walletAddress: payload.walletAddress,
        totalPnlPercent: payload.totalPnlPercent,
        totalPnlSol: payload.totalPnlSol,
        transactions: payload.transactions,
      };
      pinned = [...pinned, created];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
      return;
    }

    if (method === 'DELETE') {
      const payload = JSON.parse(route.request().postData() ?? '{}');
      pinned = pinned.filter((entry) => entry.id !== payload.id);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto('/dashboard/trades');

  await expect(page.getByText('Pinned (1)')).toBeVisible();
  await expect(page.getByText('All Trades (2)')).toBeVisible();
  await expect(page.getByRole('button', { name: '★ Pinned' })).toBeVisible();

  await page.getByRole('button', { name: '+ Pin Trade' }).click();
  await expect(page.getByText('Pinned (2)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unpin' })).toHaveCount(2);

  await page.getByRole('button', { name: 'Unpin' }).last().click();
  await expect(page.getByText('Pinned (1)')).toBeVisible();
});
