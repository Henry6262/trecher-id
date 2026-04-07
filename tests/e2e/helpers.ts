import { expect, type Page } from '@playwright/test';

const TEST_BASE_URL = 'http://127.0.0.1:3100';

export function uniqueUsername(prefix = 'pw') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTestSession(
  page: Page,
  {
    username = uniqueUsername(),
    displayName = 'Playwright User',
    bio,
  }: {
    username?: string;
    displayName?: string;
    bio?: string;
  } = {},
) {
  const response = await page.request.post('/api/test/session', {
    data: { username, displayName, bio },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();

  await page.context().addCookies([
    {
      name: 'session',
      value: data.sessionToken,
      url: TEST_BASE_URL,
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'test-auth',
      value: '1',
      url: TEST_BASE_URL,
      sameSite: 'Lax',
    },
  ]);

  return {
    username,
    displayName,
    bio,
  };
}

export async function clearTestSession(page: Page) {
  await page.request.delete('/api/test/session');
  await page.context().clearCookies();
}
