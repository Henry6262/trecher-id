import { expect, test } from '@playwright/test';
import { clearTestSession, createTestSession, uniqueUsername } from './helpers';

const VALID_WALLET = '11111111111111111111111111111111';

test('unauthorized dashboard users are redirected to login', async ({ page }) => {
  await clearTestSession(page);

  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Create Test Profile' })).toBeVisible();
});

test('dashboard wallet flow validates, adds, and removes wallets', async ({ page }) => {
  await createTestSession(page, {
    username: uniqueUsername('wallets'),
    displayName: 'Wallet Wrangler',
  });

  await page.goto('/dashboard/wallets');

  await page.getByPlaceholder('Solana wallet address').fill('not-a-wallet');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Invalid Solana address')).toBeVisible();

  await page.getByPlaceholder('Solana wallet address').fill(VALID_WALLET);
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByText('111111…1111')).toBeVisible();
  await expect(page.getByText('✓ verified')).toBeVisible();

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('No wallets linked yet')).toBeVisible();
});
