/*
 * @license
 * Copyright 2025 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 *
 *
 * NOTE: This is not an officially supported Google product
 */

const { test, expect } = require('@playwright/test');

// Read URLs from environment variables
const IDP_ORIGIN = process.env.IDP1_URL;
const RP_ORIGIN = process.env.RP_URL;

test.describe('FedCM Passive Flow E2E Test', () => {

  // Before the test, sign in to the Identity Provider (IdP)
  // to establish an active session.
  test.beforeEach(async ({ page }) => {
    // 1. Go to the IdP sign-in page.
    await page.goto(IDP_ORIGIN);

    // 2. Click "Continue" to proceed to the re-authentication step.
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL('**/reauth');

    // 3. Click "Sign-In" to complete the IdP login.
    await page.getByRole('button', { name: 'Sign-In' }).click();
    await page.waitForURL('**/home');
  });

  test('should display the FedCM prompt on the Relying Party', async ({ page }) => {
    // Use Playwright's FedCM mocking API to intercept and validate the dialog.
    await page.route('**/fedcm.json', async route => {
      await route.continue();
    });

    const dialog = await page.context().mockFedCM(async () => {
      // 4. Navigate to the Relying Party (RP) page.
      // Because we have an active IdP session, the FedCM prompt should appear.
      await page.goto(RP_ORIGIN);
    });

    // 5. Assert that the FedCM dialog content is correct.
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveTitle(`Sign in to ${new URL(RP_ORIGIN).hostname} with ${new URL(IDP_ORIGIN).hostname}`);
    await expect(dialog).toHaveText(`To continue, ${new URL(IDP_ORIGIN).hostname} will share your name, email address, and profile picture with this site.`);
  });
});
