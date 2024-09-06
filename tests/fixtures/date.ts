// tests/fixtures/date.ts
import { test as base } from "./anvil";

export const test = base.extend<{
  date: {
    addDays: (days: number) => Promise<void>;
    set: (value: number | string | Date) => Promise<Date>;
  };
}>({
  async date({ anvil, page }, use) {
    // We want to keep around a cached reference to be used
    // by `addDays()` as opposed to getting the current date
    // anew each time we call `addDays()`.
    let date = new Date();

    async function addDays(days: number) {
      date = new Date(date.setDate(date.getDate() + days));
      await set(date);
    }

    async function set(value: number | string | Date) {
      date = new Date(value);

      // Attempt to synchronize our test node's block timestamp
      // with the provided `date`. We can't set dates in the past
      // or at the current time: it will throw a Timestamp error.
      try {
        await anvil.syncDate(date);
      } catch (error) {
        console.error(error);
      }

      // Construct our patch to `window.Date`. Yes. We're
      // patching a global. Unfortunately this will mean React
      // will throw hydration warnings, but it will allow us
      // to test with mocked dates regardless.
      const dateInit = date.valueOf();
      const datePatch = `
      Date = class extends Date {
        constructor(...args) {
          super(...args.length ? args : [${dateInit}]);
        }

        now() {
          return super.now() + (${dateInit} - super.now());
        }
      };
      `;

      // Firstly we'll attach it as a `<script>` to the page
      // in Playwright. Whenever you `goto()` or `reload()` in
      // Playwright, the Date patch will be applied.
      await page.addInitScript(datePatch);
      // Secondly, we evaluate the script directly within the
      // Playwright page context. Roughly this should allow us
      // to forgo any `goto()` or `reload()`—assuming any
      // component sensitive to `Date` is rerendered before
      // doing your test assertions.
      await page.evaluate((datePatch) => {
        // Look, mom! A valid use of `eval()`!
        // eslint-disable-next-line no-eval
        eval(datePatch);
      }, datePatch);

      return date;
    }

    await use({ addDays, set });
  },
});
