/**
 * E2E Test: Landing Page
 * Tests the main landing page and navigation
 */
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the landing page', async ({ page }) => {
        await expect(page).toHaveTitle(/Quiz Battle/);
    });

    test('should display main heading', async ({ page }) => {
        // Check for main heading "Make Learning Unforgettable"
        await expect(page.getByRole('heading', { name: /Make Learning/i })).toBeVisible();
    });

    test('should display ClassDash branding', async ({ page }) => {
        await expect(page.getByText('ClassDash')).toBeVisible();
    });

    test('should show feature cards', async ({ page }) => {
        // Check for feature cards
        await expect(page.getByText('QuizBattle')).toBeVisible();
        await expect(page.getByText('LiveVote')).toBeVisible();
        await expect(page.getByText('PicPick')).toBeVisible();
        await expect(page.getByText('WordStorm')).toBeVisible();
    });

    test('should have Get Started button that links to signup', async ({ page }) => {
        const getStartedButton = page.getByRole('link', { name: /Get Started/i });
        await expect(getStartedButton).toBeVisible();

        await getStartedButton.click();
        await expect(page).toHaveURL(/signup/);
    });

    test('should display description text', async ({ page }) => {
        await expect(page.getByText(/Engage your students/i)).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Page should still show main heading
        await expect(page.getByRole('heading', { name: /Make Learning/i })).toBeVisible();

        // Get Started button should still be accessible
        await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
    });
});

test.describe('Join Class Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/join');
    });

    test('should display room code input', async ({ page }) => {
        // Check for Room Code label and input placeholder
        await expect(page.getByText('Room Code')).toBeVisible();
        await expect(page.getByPlaceholder('ABC123')).toBeVisible();
    });

    test('should have join button', async ({ page }) => {
        const joinButton = page.getByRole('button', { name: /Let's Play/i });
        await expect(joinButton).toBeVisible();
    });

    test('should have heading "Join the Fun!"', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Join the/i })).toBeVisible();
    });

    test('should have back to home button', async ({ page }) => {
        const backButton = page.getByRole('button', { name: /Back to Home/i });
        await expect(backButton).toBeVisible();
    });

    test('should show error for empty room code', async ({ page }) => {
        // Click join without entering code
        await page.getByRole('button', { name: /Let's Play/i }).click();

        // Should show error message
        await expect(page.getByText(/Please enter a room code/i)).toBeVisible();
    });

    test('should uppercase room code input', async ({ page }) => {
        const input = page.getByPlaceholder('ABC123');
        await input.fill('abc');

        // Should be uppercase
        await expect(input).toHaveValue('ABC');
    });
});
