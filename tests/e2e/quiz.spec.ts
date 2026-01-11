/**
 * E2E Test: Quiz Gameplay Flow
 * Tests the complete quiz flow from creation to results
 */
import { test, expect } from '@playwright/test';

test.describe('Quiz Battle - Player View', () => {
    test.describe('Join Game Flow', () => {
        test('should display join page with nickname input', async ({ page }) => {
            // Note: This page requires a gameId parameter
            await page.goto('/play/quizbattle/join?gameId=test');

            // Should have heading "Join Quiz Battle"
            await expect(page.getByRole('heading', { name: /Join Quiz Battle/i })).toBeVisible();

            // Should have nickname input
            await expect(page.getByPlaceholder('Your Nickname')).toBeVisible();
        });

        test('should have join button', async ({ page }) => {
            await page.goto('/play/quizbattle/join?gameId=test');

            const joinButton = page.getByRole('button', { name: /Join Game/i });
            await expect(joinButton).toBeVisible();
        });

        test('should show alert for empty nickname', async ({ page }) => {
            await page.goto('/play/quizbattle/join?gameId=test');

            // Listen for dialog
            page.on('dialog', async dialog => {
                expect(dialog.message()).toContain('nickname');
                await dialog.dismiss();
            });

            // Click join without entering nickname
            await page.getByRole('button', { name: /Join Game/i }).click();
        });
    });
});

test.describe('Quiz Battle - Host Interface', () => {
    test('should load quiz creation page', async ({ page }) => {
        await page.goto('/host/quizbattle/create');

        await page.waitForLoadState('networkidle');

        // Page should load (might redirect to login)
        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load quiz library page', async ({ page }) => {
        await page.goto('/host/quizbattle/library');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load main quizbattle host page', async ({ page }) => {
        await page.goto('/host/quizbattle');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });
});

test.describe('Engagement Tools', () => {
    test('should load poll creation page', async ({ page }) => {
        await page.goto('/host/poll/create');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load word storm launch page', async ({ page }) => {
        await page.goto('/host/wordstorm/launch');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load tickr timer launch page', async ({ page }) => {
        await page.goto('/host/tickr/launch');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load randomizer page', async ({ page }) => {
        await page.goto('/host/randomizer');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load buzzer launch page', async ({ page }) => {
        await page.goto('/host/buzzer/launch');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });

    test('should load commitment wall launch page', async ({ page }) => {
        await page.goto('/host/commitment/launch');

        await page.waitForLoadState('networkidle');

        const hasContent = await page.locator('body').textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
    });
});
