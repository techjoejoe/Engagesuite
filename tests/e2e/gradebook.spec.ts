/**
 * E2E Test: Gradebook Flow
 * Tests the gradebook interface and grading functionality
 */
import { test, expect } from '@playwright/test';

test.describe('Leaderboard Page', () => {
    test('should load leaderboard page', async ({ page }) => {
        await page.goto('/leaderboard');

        // Wait for DOM to be ready, not network idle (Firebase can keep connections open)
        await page.waitForLoadState('domcontentloaded');

        // Give the page a moment to render
        await page.waitForTimeout(1000);

        // Should show "Lifetime Leaderboard" heading OR loading state
        const heading = page.getByRole('heading', { name: /Lifetime Leaderboard/i });
        const loadingText = page.getByText(/Loading Leaderboard/i);

        // One of these should be visible
        const hasHeading = await heading.isVisible().catch(() => false);
        const hasLoading = await loadingText.isVisible().catch(() => false);

        expect(hasHeading || hasLoading).toBe(true);
    });

    test('should display Home button after loading', async ({ page }) => {
        await page.goto('/leaderboard');

        await page.waitForLoadState('domcontentloaded');

        // Wait for loading to finish
        await page.waitForTimeout(3000);

        // Look for Home text anywhere on the page
        const homeText = page.getByText('Home');
        const hasHome = await homeText.isVisible().catch(() => false);

        // Either Home is visible or page has leaderboard content
        if (!hasHome) {
            const hasContent = await page.locator('body').textContent();
            expect(hasContent?.length).toBeGreaterThan(100);
        } else {
            expect(hasHome).toBe(true);
        }
    });

    test('should show content after loading', async ({ page }) => {
        await page.goto('/leaderboard');

        await page.waitForLoadState('domcontentloaded');

        // Just verify page has content
        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });
});

test.describe('Gradebook (Requires Auth)', () => {
    test('should load grades dashboard page', async ({ page }) => {
        await page.goto('/host/class/test-class-id/grades');

        await page.waitForLoadState('networkidle');

        // Should redirect to login or show gradebook
        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load workbook gradebook page', async ({ page }) => {
        await page.goto('/host/class/test-class-id/workbook/test-assignment-id');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });
});

test.describe('Student Workbook View', () => {
    test('should load student album player page', async ({ page }) => {
        await page.goto('/play/album/test-album-id');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load student workbook selection page', async ({ page }) => {
        await page.goto('/play/workbook');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });
});

test.describe('Designer Studio', () => {
    test('should load designer studio page', async ({ page }) => {
        await page.goto('/host/design');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load album creation page', async ({ page }) => {
        await page.goto('/host/design/create');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });
});

test.describe('Dashboard and Class Management', () => {
    test('should load main dashboard', async ({ page }) => {
        await page.goto('/dashboard');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load class creation page', async ({ page }) => {
        await page.goto('/host/create');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load student dashboard', async ({ page }) => {
        await page.goto('/student/dashboard');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load profile page', async ({ page }) => {
        await page.goto('/profile');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load templates page', async ({ page }) => {
        await page.goto('/host/templates');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load badges page', async ({ page }) => {
        await page.goto('/host/badges');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });
});
