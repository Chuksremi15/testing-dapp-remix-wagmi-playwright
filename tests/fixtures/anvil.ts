import { test as base } from "@playwright/test";
import { createTestClient, http, publicActions, walletActions } from "viem";
import { foundry } from "viem/chains";

const anvil = createTestClient({
  chain: foundry,
  mode: "anvil",
  transport: http(),
})
  .extend(publicActions)
  .extend(walletActions)
  // `client.extend()` is a very low-barrier utility, allowing you
  // to write custom methods for a viem client easily. It receives
  // a callback with the `client` as argument, returning an object
  // with any properties or methods you want to tack on.
  // We return an object with an `async syncDate(date)` method.
  .extend((client) => ({
    async syncDate(date: Date) {
      await client.setNextBlockTimestamp({
        // NOTE: JavaScript Date.getTime returns milliseconds.
        timestamp: BigInt(Math.round(date.getTime() / 1000)),
      });
      // We need to mine a block to commit its next timestamp.
      return client.mine({ blocks: 1 });
    },
  }));

export const test = base.extend<{ anvil: typeof anvil }>({
  async anvil({}, use) {
    await use(anvil);
  },
});
