import { expect, test } from '@playwright/test';
import { createTestSession, uniqueUsername } from './helpers';

test('api routes enforce auth and validate profile inputs', async ({ page, request }) => {
  const unauthorizedProfile = await request.get('/api/profile');
  expect(unauthorizedProfile.status()).toBe(401);

  await createTestSession(page, {
    username: uniqueUsername('api'),
    displayName: 'API Tester',
  });

  const invalidAccent = await page.request.patch('/api/profile', {
    data: { accentColor: 'blue' },
  });
  expect(invalidAccent.status()).toBe(400);

  const invalidBanner = await page.request.patch('/api/profile', {
    data: { bannerUrl: 'not-a-url' },
  });
  expect(invalidBanner.status()).toBe(400);

  const missingLinkFields = await page.request.post('/api/links', {
    data: { title: '', url: '' },
  });
  expect(missingLinkFields.status()).toBe(400);

  const missingWalletAddress = await page.request.post('/api/wallets', {
    data: {},
  });
  expect(missingWalletAddress.status()).toBe(400);

  const validProfile = await page.request.patch('/api/profile', {
    data: {
      displayName: 'Validated User',
      bio: 'Valid bio',
      accentColor: '#22c55e',
      bannerUrl: 'https://example.com/banner.jpg',
    },
  });

  expect(validProfile.ok()).toBeTruthy();
  await expect(validProfile.json()).resolves.toMatchObject({
    displayName: 'Validated User',
    bio: 'Valid bio',
    accentColor: '#22c55e',
    bannerUrl: 'https://example.com/banner.jpg',
  });
});
