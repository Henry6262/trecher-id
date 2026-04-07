import { expect, test } from '@playwright/test';
import { createTestSession, uniqueUsername } from './helpers';

test('referral capture sets the referral cookie for a valid code', async ({ page }) => {
  const referralCode = uniqueUsername('referrer');

  await createTestSession(page, {
    username: referralCode,
    displayName: 'Referral Source',
  });

  const response = await page.request.post('/api/referral/capture', {
    data: { code: referralCode.toUpperCase() },
  });

  expect(response.ok()).toBeTruthy();

  const cookies = await page.context().cookies();
  const refCookie = cookies.find((cookie) => cookie.name === 'ref_code');
  expect(refCookie?.value).toBe(referralCode);
});

test('referrals dashboard renders mocked stats and copies the referral link', async ({ page }) => {
  const username = uniqueUsername('refs');
  await createTestSession(page, {
    username,
    displayName: 'Referral Boss',
  });

  await page.route('**/api/referral/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        referralCode: username,
        validatedCount: 4,
        pendingCount: 2,
        currentBoost: 5,
        currentTier: { min: 4, max: 5, boost: 5 },
        nextTier: { min: 6, max: 15, boost: 7.5, remaining: 2 },
        recentReferrals: [
          {
            username: 'alpha_ref',
            displayName: 'Alpha Ref',
            avatarUrl: null,
            validatedAt: '2026-04-01T00:00:00.000Z',
          },
        ],
      }),
    });
  });

  await page.addInitScript(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: () => Promise.resolve(),
      },
    });
  });

  await page.goto('/dashboard/referrals');

  await expect(page.getByText('YOUR REFERRAL LINK')).toBeVisible();
  await expect(page.getByText(`http://127.0.0.1:3100/?ref=${username}`)).toBeVisible();
  await expect(page.getByText('+5%')).toBeVisible();
  await expect(page.getByText('2 more invites to unlock 7.5% boost')).toBeVisible();
  await expect(page.getByText('Alpha Ref')).toBeVisible();

  await page.getByRole('button', { name: /Copy/i }).click();
  await expect(page.getByRole('button', { name: /Copied!/i })).toBeVisible();
});

test('share card page renders for an existing profile', async ({ page }) => {
  const username = uniqueUsername('card');

  await createTestSession(page, {
    username,
    displayName: 'Card Shark',
    bio: 'Ready to share',
  });

  await page.goto(`/${username}/card`);

  await expect(page.getByText(`@${username}`)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Share on X' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Link' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save PNG' })).toBeVisible();
});
