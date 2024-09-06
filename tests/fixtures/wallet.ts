import { type Page } from "@playwright/test";
import { type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { test as base } from "@playwright/test";
import { type MockParameters } from "wagmi/connectors";

// It helps if we give accounts names, as it makes discerning
// different accounts more clear. It's easier to talk about
// Alice and Bob in tests than "wallet starting with 0xf39...".
// NOTE: These private keys are provided by `anvil`.
const ACCOUNT_PKEYS = {
  alice: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  bob: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
} as const;

// A fixture doesn't need to be a class. It could just as well
// be a POJO, function, scalar, etc. In our case a class keeps
// things nice and organized.
export class WalletFixture {
  address?: Address;
  #page: Page;

  // The only thing we require for setting up a wallet connection
  // through the mock connector is the page to look up elements.
  constructor({ page }: { page: Page }) {
    this.#page = page;
  }

  // You can make this as contrived or expansive as required for
  // your use-case. For Endgame, we actually derive accounts from
  // an `ANVIL_MNEMONIC` env with viem's `mnemonicToAccount()`.
  async connect(
    name: keyof typeof ACCOUNT_PKEYS,
    features?: MockParameters["features"]
  ) {
    const pkey = ACCOUNT_PKEYS[name];
    const account = privateKeyToAccount(pkey);

    this.address = account.address;

    await this.#setup(pkey, features);
    await this.#login();
  }

  // Any application-specific rituals to get a wallet connected
  // can be put here. In our demo app we click a button.
  async #login() {
    await this.#page.getByRole("button", { name: "Mock Connector" }).click();
  }

  // Remember how we slapped our mock configuration helper onto
  // `window._setupAccount`? Here's how to use it in Playwright:
  async #setup(...args: [Hex, MockParameters["features"]]) {
    // We let Playwright wait for the function to be non-nullable
    // on the `window` global. This ensures we can use it.
    await this.#page.waitForFunction(() => window._setupAccount);
    // `page.evaluate()` is a _very_ powerful method which allows
    // you to evaluate a script inside the browser page context.
    // In this example, we evaluate `window._setupAccount()`
    // with arguments passed from inside Playwright tests.
    await this.#page.evaluate((args) => window._setupAccount(...args), args);
  }
}

// Lastly, we export a `test` with the `WalletFixture` attached.
export const test = base.extend<{ wallet: WalletFixture }>({
  async wallet({ page }, use) {
    await use(new WalletFixture({ page }));
  },
});
