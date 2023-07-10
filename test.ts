import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { load } from "https://deno.land/std@0.193.0/dotenv/mod.ts";
import { authenticateWithNpsso } from "./src/authentication/authentication.ts";

let NPSSO: string | undefined;
if (Deno.env.has("RUNNING_AS_GITHUB_ACTION")) {
  NPSSO = Deno.env.get("TEST_NPSSO");
}
if (NPSSO === undefined) {
  const env = await load();
  NPSSO = env["TEST_NPSSO"];
}

// Tests wether a valid NPSSO is provided and it's possible to authenticate on PSN using it
Deno.test({ name: "Authenticate using NPSSO" }, async (t) => {
  // Test if a NPSSO was passed
  await t.step(
    "Check if a valid NPSSO was passed as Enviroment Variable",
    () => {
      assert(typeof NPSSO === "string");
    },
  );
  // Test if the NPSSO passed was changed, rather than using the default string on './.env'
  await t.step(
    "Check if the test the NPSSO string was changed from default",
    () => {
      assertNotEquals(NPSSO, "PUT_YOUR_NPSSO_HERE_FOR_LOCAL_TESTS");
    },
  );
  // Test if an authentication attempt returns a valid object with all required properties
  await t.step("Authenticate with PSN", async (t) => {
    const authentication = await authenticateWithNpsso(NPSSO as string);
    await t.step("Authentication has accessToken", () => {
      assertEquals(typeof authentication.accessToken, "string");
    });
    await t.step("Authentication has tokenExpirationEpoch", () => {
      assertEquals(typeof authentication.tokenExpirationEpoch, "number");
    });
    await t.step("Authentication has humanReadableTokenExpiration", () => {
      assertEquals(
        typeof authentication.humanReadableTokenExpiration,
        "string",
      );
    });
    await t.step("Authentication has refreshToken", () => {
      assertEquals(typeof authentication.refreshToken, "string");
    });
    await t.step("Authentication has tokenExpirationEpoch", () => {
      assertEquals(typeof authentication.tokenExpirationEpoch, "number");
    });
    await t.step(
      "Authentication has humanReadableRefreshTokenExpiration",
      () => {
        assertEquals(
          typeof authentication.humanReadableRefreshTokenExpiration,
          "string",
        );
      },
    );
  });
});
