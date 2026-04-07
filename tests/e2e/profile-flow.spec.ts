import { expect, test } from '@playwright/test';
import { uniqueUsername } from './helpers';

test('can create a profile through the test login flow and publish edits', async ({ page }) => {
  const username = uniqueUsername();

  await page.goto('/login');
  await page.getByLabel('Test Username').fill(username);
  await page.getByLabel('Test Display Name').fill('Launch Pilot');
  await page.getByRole('button', { name: 'Create Test Profile' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByLabel('Display Name').fill('Fast Furious');
  await page.getByLabel('Bio').fill('Profile creation smoke test bio');
  await page.getByLabel('Banner Image URL').fill('https://example.com/banner.jpg');
  await page.getByRole('button', { name: 'Save Profile' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();

  await page.getByLabel('Link Label').fill('Docs');
  await page.getByLabel('Link URL').fill('https://example.com/docs');
  await page.getByRole('button', { name: '+ Add Link' }).click();
  await expect(page.getByText('https://example.com/docs')).toBeVisible();

  await page.goto(`/${username}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Profile creation smoke test bio')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', 'https://example.com/docs');
});
