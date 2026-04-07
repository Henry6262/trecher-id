import { expect, test } from '@playwright/test';
import { createTestSession, uniqueUsername } from './helpers';

test('public pages render and a lightweight profile responds quickly', async ({ page, request }) => {
  const username = uniqueUsername('speed');
  await createTestSession(page, {
    username,
    displayName: 'Speed Runner',
    bio: 'Fast profile',
  });

  const landingStart = Date.now();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const landingDuration = Date.now() - landingStart;
  expect(landingDuration).toBeLessThan(5000);
  await expect(page.getByRole('heading', { name: /Bio Link/i })).toBeVisible();

  const profileStart = Date.now();
  const profileResponse = await request.get(`/${username}`);
  const profileDuration = Date.now() - profileStart;
  expect(profileResponse.ok()).toBeTruthy();
  expect(profileDuration).toBeLessThan(3000);

  await page.goto(`/${username}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Fast profile')).toBeVisible();

  const leaderboardStart = Date.now();
  const leaderboardResponse = await request.get('/leaderboard');
  const leaderboardDuration = Date.now() - leaderboardStart;
  expect(leaderboardResponse.ok()).toBeTruthy();
  expect(leaderboardDuration).toBeLessThan(3000);

  await page.goto('/leaderboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Top Traders/i })).toBeVisible();
});

test('leaderboard shows the low-trader fallback when the ranking set is small', async ({ page }) => {
  await page.route('**/api/leaderboard?period=7d&limit=50', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          rank: 1,
          username: 'alpha',
          displayName: 'Alpha',
          avatarUrl: null,
          isClaimed: true,
          pnlUsd: 1200,
          pnlSol: 8,
          winRate: 70,
          trades: 25,
        },
        {
          rank: 2,
          username: 'bravo',
          displayName: 'Bravo',
          avatarUrl: null,
          isClaimed: true,
          pnlUsd: 800,
          pnlSol: 5,
          winRate: 62,
          trades: 18,
        },
        {
          rank: 3,
          username: 'charlie',
          displayName: 'Charlie',
          avatarUrl: null,
          isClaimed: true,
          pnlUsd: 300,
          pnlSol: 2,
          winRate: 55,
          trades: 11,
        },
      ]),
    });
  });

  await page.goto('/leaderboard');

  await expect(page.getByText('Not enough traders for bracket (need 32)')).toBeVisible();
  await expect(page.getByText('Currently 3 traders ranked')).toBeVisible();
});

test('unknown profiles render the not-found page', async ({ page, request }) => {
  const missingUsername = uniqueUsername('missing');

  const response = await request.get(`/${missingUsername}`);
  expect(response.status()).toBe(404);

  await page.goto(`/${missingUsername}`);
  await expect(page.getByText("This trader doesn't exist yet.")).toBeVisible();
});
