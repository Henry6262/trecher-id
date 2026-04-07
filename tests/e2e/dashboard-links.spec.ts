import { expect, test } from '@playwright/test';
import { createTestSession, uniqueUsername } from './helpers';

test('dashboard link deletion removes the link from the public profile', async ({ page }) => {
  const username = uniqueUsername('links');

  await createTestSession(page, {
    username,
    displayName: 'Link Surgeon',
    bio: 'Delete links cleanly',
  });

  await page.goto('/dashboard');

  await page.getByLabel('Link Label').fill('Docs');
  await page.getByLabel('Link URL').fill('https://example.com/docs');
  await page.getByRole('button', { name: '+ Add Link' }).click();

  await expect(page.getByText('https://example.com/docs')).toBeVisible();

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('No links yet.')).toBeVisible();

  await page.goto(`/${username}`);
  await expect(page.getByRole('link', { name: 'Docs' })).toHaveCount(0);
  await expect(page.locator('a[href=\"https://example.com/docs\"]')).toHaveCount(0);
});
