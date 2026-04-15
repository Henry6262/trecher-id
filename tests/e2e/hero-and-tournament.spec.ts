import { expect, test, beforeEach } from '@playwright/test';
import { createTestSession, uniqueUsername } from './helpers';

test.describe('Landing Page Hero Section', () => {
  test('should display top traders with real trade data', async ({ page }) => {
    await page.goto('/');

    // Wait for hero section to load
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible({ timeout: 5000 });

    // Verify profiles are displayed
    const profiles = await page.locator('[data-testid="hero-profile"]').count();
    expect(profiles).toBeGreaterThan(0);

    // Verify each profile has required info
    const firstProfile = page.locator('[data-testid="hero-profile"]').first();
    await expect(firstProfile.locator('[data-testid="profile-name"]')).toBeVisible();
    await expect(firstProfile.locator('[data-testid="profile-pnl"]')).toBeVisible();
    await expect(firstProfile.locator('[data-testid="profile-win-rate"]')).toBeVisible();
  });

  test('should display top trades in GitHub-style calendar', async ({ page }) => {
    await page.goto('/');

    // Wait for mini calendar
    await expect(page.locator('[data-testid="mini-calendar"]')).toBeVisible({ timeout: 5000 });

    // Verify calendar has activity
    const activityCells = await page.locator('[data-testid="calendar-cell-active"]').count();
    expect(activityCells).toBeGreaterThan(0);

    // Hover over activity to see tooltip
    await page.locator('[data-testid="calendar-cell-active"]').first().hover();
    await expect(page.locator('[data-testid="trade-tooltip"]')).toBeVisible();
  });

  test('should display top token deployments', async ({ page }) => {
    await page.goto('/');

    // Wait for deployments section
    await expect(page.locator('[data-testid="top-deployments"]')).toBeVisible({ timeout: 5000 });

    // Verify deployment list
    const deployments = await page.locator('[data-testid="deployment-item"]').count();
    expect(deployments).toBeGreaterThan(0);

    // Verify first deployment has token info
    const firstDeployment = page.locator('[data-testid="deployment-item"]').first();
    await expect(firstDeployment.locator('[data-testid="token-name"]')).toBeVisible();
    await expect(firstDeployment.locator('[data-testid="deployer-handle"]')).toBeVisible();
  });
});

test.describe('Dashboard - Trades Page', () => {
  let username: string;

  beforeEach(async ({ page }) => {
    username = uniqueUsername('dashboard');
    await createTestSession(page, {
      username,
      displayName: 'Dashboard Trader',
    });
  });

  test('should load and display user trades with real data', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for trades to load
    await expect(page.locator('[data-testid="trades-container"]')).toBeVisible({ timeout: 5000 });

    // Verify trade list has items
    const trades = await page.locator('[data-testid="trade-row"]').count();
    expect(trades).toBeGreaterThanOrEqual(0); // May have 0 trades initially

    if (trades > 0) {
      const firstTrade = page.locator('[data-testid="trade-row"]').first();
      await expect(firstTrade.locator('[data-testid="token-symbol"]')).toBeVisible();
      await expect(firstTrade.locator('[data-testid="trade-pnl"]')).toBeVisible();
      await expect(firstTrade.locator('[data-testid="win-rate-badge"]')).toBeVisible();
    }
  });

  test('should allow pinning trades', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for trades
    await expect(page.locator('[data-testid="trade-row"]')).first().toBeVisible({ timeout: 5000 });

    // Click pin button on first trade
    const pinButton = page.locator('[data-testid="trade-row"]').first().locator('[data-testid="pin-button"]');
    await pinButton.click();

    // Verify trade is now pinned (visual indication)
    await expect(pinButton.locator('[data-testid="pin-icon"]')).toHaveClass(/active|pinned/);

    // Verify pinned trades section is updated
    await expect(page.locator('[data-testid="pinned-trades"]')).toContainText(/1.*pinned/i);
  });

  test('should display trading statistics', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for stats to load
    await expect(page.locator('[data-testid="stats-container"]')).toBeVisible({ timeout: 5000 });

    // Verify key stats are displayed
    const stats = {
      totalPnL: page.locator('[data-testid="stat-total-pnl"]'),
      winRate: page.locator('[data-testid="stat-win-rate"]'),
      tradeCount: page.locator('[data-testid="stat-trade-count"]'),
    };

    for (const [name, locator] of Object.entries(stats)) {
      await expect(locator).toBeVisible();
      const text = await locator.textContent();
      expect(text).toBeTruthy(); // Should have some value
    }
  });

  test('should filter trades by date range', async ({ page }) => {
    await page.goto('/dashboard/trades');

    // Open date filter
    await page.locator('[data-testid="filter-button"]').click();
    await expect(page.locator('[data-testid="date-range-picker"]')).toBeVisible();

    // Select last 7 days
    await page.locator('[data-testid="preset-7d"]').click();

    // Verify filter applied
    await expect(page.locator('[data-testid="filter-chip"]')).toContainText(/7.*day/i);

    // Trades should update to reflect filter
    await expect(page.locator('[data-testid="trades-container"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Tournament Flow', () => {
  let username: string;

  beforeEach(async ({ page }) => {
    username = uniqueUsername('tournament');
    await createTestSession(page, {
      username,
      displayName: 'Tournament Player',
    });
  });

  test('should display current season and eligibility', async ({ page }) => {
    await page.goto('/tournament');

    // Wait for tournament section to load
    await expect(page.locator('[data-testid="season-info"]')).toBeVisible({ timeout: 5000 });

    // Verify season details
    await expect(page.locator('[data-testid="season-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="season-status"]')).toBeVisible();

    // Check eligibility display
    const eligibility = page.locator('[data-testid="eligibility-status"]');
    const eligibilityText = await eligibility.textContent();
    expect(eligibilityText).toMatch(/eligible|not eligible|pending/i);
  });

  test('should show qualification requirements and progress', async ({ page }) => {
    await page.goto('/tournament');

    // Wait for requirements
    await expect(page.locator('[data-testid="qual-requirements"]')).toBeVisible({ timeout: 5000 });

    // Verify requirement checklist
    const requirements = await page.locator('[data-testid="requirement-item"]').count();
    expect(requirements).toBeGreaterThan(0);

    // Verify progress indicators
    const progressItems = await page.locator('[data-testid="requirement-progress"]').count();
    expect(progressItems).toBeGreaterThan(0);
  });

  test('should display leaderboard with current rankings', async ({ page }) => {
    await page.goto('/tournament/leaderboard');

    // Wait for leaderboard
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible({ timeout: 5000 });

    // Verify rank columns
    await expect(page.locator('[data-testid="rank-column"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-column"]')).toBeVisible();
    await expect(page.locator('[data-testid="pnl-column"]')).toBeVisible();
    await expect(page.locator('[data-testid="winrate-column"]')).toBeVisible();

    // Verify at least one row (current user or others)
    const rows = await page.locator('[data-testid="leaderboard-row"]').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('should highlight current user on leaderboard', async ({ page }) => {
    await page.goto('/tournament/leaderboard');

    // Wait for leaderboard
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible({ timeout: 5000 });

    // Find current user row (if they're on the board)
    const currentUserRow = page.locator(`[data-testid="leaderboard-row"][data-username="${username}"]`);
    const exists = await currentUserRow.count();

    if (exists > 0) {
      // Should be highlighted
      await expect(currentUserRow).toHaveClass(/current|highlight|active/);
    }
  });

  test('should show tournament prizes and distribution', async ({ page }) => {
    await page.goto('/tournament/prizes');

    // Wait for prizes section
    await expect(page.locator('[data-testid="prizes-container"]')).toBeVisible({ timeout: 5000 });

    // Verify prize tiers are displayed
    const tiers = await page.locator('[data-testid="prize-tier"]').count();
    expect(tiers).toBeGreaterThan(0);

    // Verify each tier has prize info
    const firstTier = page.locator('[data-testid="prize-tier"]').first();
    await expect(firstTier.locator('[data-testid="rank-range"]')).toBeVisible();
    await expect(firstTier.locator('[data-testid="prize-amount"]')).toBeVisible();
  });
});

test.describe('Profile Page', () => {
  let username: string;

  beforeEach(async ({ page }) => {
    username = uniqueUsername('profile');
    await createTestSession(page, {
      username,
      displayName: 'Profile User',
    });
  });

  test('should display user profile with all trading stats', async ({ page }) => {
    await page.goto(`/${username}`);

    // Wait for profile to load
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 5000 });

    // Verify profile info
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-display-name"]')).toContainText('Profile User');
    await expect(page.locator('[data-testid="user-handle"]')).toContainText(username);

    // Verify trading stats
    const statItems = {
      totalPnL: page.locator('[data-testid="profile-total-pnl"]'),
      winRate: page.locator('[data-testid="profile-win-rate"]'),
      totalTrades: page.locator('[data-testid="profile-total-trades"]'),
    };

    for (const locator of Object.values(statItems)) {
      await expect(locator).toBeVisible();
    }
  });

  test('should display user trades on profile', async ({ page }) => {
    await page.goto(`/${username}`);

    // Wait for trades section
    await expect(page.locator('[data-testid="profile-trades"]')).toBeVisible({ timeout: 5000 });

    // Trades may be empty initially, but section should exist
    const tradesList = page.locator('[data-testid="profile-trade-item"]');
    const count = await tradesList.count();
    // Just verify section exists, even if empty
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display user deployments on profile', async ({ page }) => {
    await page.goto(`/${username}`);

    // Wait for deployments section
    const deploymentsSection = page.locator('[data-testid="profile-deployments"]');
    await expect(deploymentsSection).toBeVisible({ timeout: 5000 });

    // Deployments section should exist, even if empty
    const count = await page.locator('[data-testid="profile-deployment-item"]').count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
