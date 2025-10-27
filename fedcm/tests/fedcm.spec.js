/*
 * @license
 * Copyright 2019 Google Inc. All rights reserved.
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

import { test, expect } from '@playwright/test';

test('FedCM passive dialog', async ({ page, browserName}, testInfo) => {
  const expectedTitle = "Sign in to fedcm-rp-demo.localhost with fedcm-idp-demo.localhost";
  let fedCmDialogPromise;
  let cdpSession;

  // Setup
  await test.step('1) Setup', async () => {
    test.skip(browserName !== 'chromium', 'FedCM is not yet supoprted in non-Chromium browsers');
    
    const isHeaded = testInfo.project.use.headless === false;
    cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('FedCm.enable');

    // This will wait for the 'FedCm.dialogShown' event.
    // The validation logic is placed inside the listener itself.
    fedCmDialogPromise = new Promise((resolve, reject) => {
      cdpSession.on('FedCm.dialogShown', async (payload) => { 
        try {
          // --- Start of assertions ---
          expect(payload.dialogType).toBe("AccountChooser");
          expect(payload.accounts[0].email).toBe("demo@example.com");
          // Conditionally check the title
          if (isHeaded) {
            console.log("Running HEADED, checking title...");
            expect(payload.title).toBe(expectedTitle);
          } else {
            // It's potentially a FedCM CDP implementation bug, but the title is currently empty in headless mode
            console.log("Running HEADLESS, skipping title check (known issue).");
          }
          // --- End of assertions ---

          resolve(true); 
        } catch (error) {
          console.log("Error in the FedCM dialog promise:", error)
          reject(error); 
        }
      });
    });
  });

  // Sign in with IdP
  await test.step('2) Sign in with IdP', async () => {
    // Visit the IdP page
    await page.goto('https://fedcm-idp-demo.localhost');
    
    // Expect to see "Sign-in" text
    await expect(page.getByRole('heading', { name: 'Sign-in' })).toBeVisible();
    
    // Click the "Continue" button
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Expect to see "Enter password" text
    await expect(page.getByText('Enter a password')).toBeVisible();
    
    // Click "Sign-in button"
    await page.getByRole('button', { name: 'Sign-In', exact: true }).click();
    
    // Expect to see "Welcome, demo@example.com!" text
    await expect(page.getByText('Welcome, demo@example.com!')).toBeVisible();
  });

  // Land on RP
  await test.step('3) Land on RP and check that FedCM dialog was shown', async () => {
    // Go to "https://fedcm-rp-demo.localhost/" page
    await page.goto('https://fedcm-rp-demo.localhost/');
    
    // Expect to see "Welcome to the FedCM RP Demo: Passive Mode" text
    await expect(page.getByText('Welcome to the FedCM RP Demo: Passive Mode')).toBeVisible();
  });

  // Validate the FedCM dialog
  await test.step('4) Validate the FedCM dialog', async () => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: FedCm.dialogShown event did not fire in 5s')), 5000)
    );

    await expect(Promise.race([
      fedCmDialogPromise, 
      timeoutPromise
    ])).resolves.toBe(true);
  });

  // --- Cleanup ---
  // This runs after all steps are complete
  await cdpSession.detach();
  await page.close({ runBeforeUnload: true });
});

test('FedCM mismatch', async ({ page: page, browserName }, testInfo) => {
  let cdpSession;
  let fedCmMismatchDialogPromise;
  let mismatchDialogId;
  let idpPagePromise;
  let fedCmDialogPromise;
  let accountChooserDialogId;
  const expectedTitle = "Sign in to fedcm-rp-demo.localhost with fedcm-idp-demo.localhost";

  // Setup
  await test.step('1) Setup', async () => {
    test.skip(browserName !== 'chromium', 'FedCM is not yet supoprted in non-Chromium browsers');
    
    const isHeaded = testInfo.project.use.headless === false;
    cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('FedCm.enable');
    await cdpSession.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true 
    });

    // Listener for the dialog
    fedCmMismatchDialogPromise = new Promise((resolve, reject) => {
      cdpSession.on('FedCm.dialogShown', (payload) => {

        if (payload.dialogType !== "ConfirmIdpLogin") {
          console.log('MismatchListener: Ignoring dialog type', payload.dialogType);
          return; 
        }

        try {
          // --- Start of assertions ---
          expect(payload.accounts.length).toBe(0);

          if (isHeaded) {
            console.log("Running HEADED, checking title...");
            expect(payload.title).toBe(expectedTitle);
          } else {
            // It's potentially a FedCM CDP implementation bug, but the title is currently empty in headless mode (as of 143)
            console.log("Running HEADLESS, skipping title check (known issue).");
          }
          // --- End of assertions ---

          mismatchDialogId = payload.dialogId;
          resolve(payload.dialogId); 
        } catch (error) {
          reject(error);
        }
      });
    });

    fedCmDialogPromise = new Promise((resolve, reject) => {
      cdpSession.on('FedCm.dialogShown', async (payload) => { 

         if (payload.dialogType !== "AccountChooser") {
          console.log('MismatchListener: Ignoring dialog type', payload.dialogType);
          return; 
        }

        try {
          // --- Start of assertions ---
          expect(payload.accounts[0].email).toBe("demo@example.com");
          // Conditionally check the title
          if (isHeaded) {
            console.log("Running HEADED, checking title...");
            expect(payload.title).toBe(expectedTitle);
          } else {
            // It's potentially a FedCM CDP implementation bug, but the title is currently empty in headless mode (as of 143)
            console.log("Running HEADLESS, skipping title check (known issue).");
          }
          // --- End of assertions ---

          accountChooserDialogId = payload.dialogId;
          resolve(true);
        } catch (error) {
          reject(error); 
        }
      });
    });
  });


  await test.step('2) Sign in with IdP (Session Expired)', async () => {
    // Visit IdP
    await page.goto('https://fedcm-idp-demo.localhost');
    await expect(page.getByRole('heading', { name: 'Sign-in' })).toBeVisible();
    
    // Click Continue
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Enter a password')).toBeVisible();

    // Select "session expired" status
    await page.getByLabel('Account status').click();
    await page.getByRole('option', { name: 'Session expired' }).click();
    
    // Click "Sign-in button"
    await page.getByRole('button', { name: 'Sign-In', exact: true }).click();
    
    // Expect to see "Welcome, demo@example.com!" text
    await expect(page.getByText('Welcome, demo@example.com!')).toBeVisible();

    // Validate session expired status
    const dropdown = page.getByLabel('Account status');
    const selectedValue = dropdown.locator('.mdc-select__selected-text');
    await expect(selectedValue).toHaveText('Session Expired');
  });

  // Land on RP
  await test.step('3) Land on RP', async () => {
    // Go to RP page. This navigation triggers the FedCM dialog.
    await page.goto('https://fedcm-rp-demo.localhost/');
    
    // Expect to see RP welcome text
    await expect(page.getByText('Welcome to the FedCM RP Demo: Passive Mode')).toBeVisible();
  });

  // 4) Validate, Continue on FedCM dialog, and check popup
  await test.step('4) Validate dialog, click Continue button', async () => {
    // Wait for the FedCM dialog to appear
    const dialogTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: FedCm.dialogShown event did not fire in 10s')), 10000)
    );

    // Validate that FedCM mismatch dialog was shown
    await expect(Promise.race([
      fedCmMismatchDialogPromise, 
      dialogTimeout
    ])).resolves.toBeTruthy();


    // We expect the IdP popup to open after the "Continue" button click
    idpPagePromise = page.context().waitForEvent('page');

    // Click "Continue" on the 'ConfirmIdpLogin' mismatch dialog.
    if (mismatchDialogId) {
      await cdpSession.send('FedCm.clickDialogButton', {
        dialogId: mismatchDialogId,
        dialogButton: 'ConfirmIdpLoginContinue' 
      })
    } 
  });

  const idpPage = await idpPagePromise;

  await test.step('4) Re-login in on IdP', async () => {
    await expect(idpPage.getByText('FedCM IDP Demo')).toBeVisible();
    await expect(idpPage.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await idpPage.getByRole('link', { name: 'Sign out' }).click();

    await expect(idpPage.getByRole('heading', { name: 'Sign-in' })).toBeVisible();
    
    // Click Continue
    await idpPage.getByRole('button', { name: 'Continue' }).click();
    await expect(idpPage.getByText('Enter a password')).toBeVisible();

    // Click "Sign-in" button
    await idpPage.getByRole('button', { name: 'Sign-In', exact: true }).click();

  });

  await test.step('5) Test the FedCM sing in on the RP', async () => {
     await expect(page.getByText('Welcome to the FedCM RP Demo: Passive Mode')).toBeVisible();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: FedCm.dialogShown event did not fire in 5s')), 5000)
    );

    // We expect the FedCM account chooser dialog to appear
    await expect(Promise.race([
      fedCmDialogPromise, 
      timeoutPromise
    ])).resolves.toBe(true);

    // TODO: Ideally, we'd like to be able to interact with the continue button via CDP for testing purposes
    // As of Chrome 142, this type of button doesn't seem to be supported     
    // if (accountChooserDialogId) {
    //   await cdpSession.send('FedCm.clickDialogButton', {
    //     dialogId: accountChooserDialogId, 
    //     dialogButton: 'ConfirmIdpLoginContinue' 
    //   })
    // }

  });

  // --- Cleanup ---
  await cdpSession.detach();
  await page.close({ runBeforeUnload: true });
});
