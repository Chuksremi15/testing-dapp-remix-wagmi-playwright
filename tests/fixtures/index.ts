// tests/fixtures/index.ts
import { mergeTests } from "@playwright/test";

import { test as anvilTest } from "./anvil";
import { test as dateTest } from "./date";
import { test as walletTest } from "./wallet";

// Re-export anything from Playwright.
export * from "@playwright/test";
// Export our test function, extended with fixtures.
// It'll become useful when we have more fixtures to attach.
export const test = mergeTests(anvilTest, dateTest, walletTest);
