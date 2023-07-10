import {
  assert,
  assertEquals,
  assertIsError,
  assertNotEquals,
} from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { load } from "https://deno.land/std@0.193.0/dotenv/mod.ts";
import { authenticateWithNpsso } from "./src/authentication/authenticateWithNpsso.ts";
import { AuthenticationData } from "./types/authentication/AuthenticationData_type.ts";
import { getAccessCode } from "./src/authentication/getAccessCode.ts";
import { getAuthorizationToken } from "./src/authentication/getAuthorizationToken.ts";

let NPSSO: string | undefined;
if (Deno.env.has("RUNNING_AS_GITHUB_ACTION")) {
  NPSSO = Deno.env.get("TEST_NPSSO");
}
if (NPSSO === undefined) {
  const env = await load();
  NPSSO = env["TEST_NPSSO"];
}
let auth: AuthenticationData;

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
    auth = authentication;
  });
});

Deno.test("Authentication workflow throws appropriate errors when bad information is provided", async (t) => {
  // Test if an error is thrown when a bad NPSSO string is passed to getAccessCode()
  await t.step(
    "Fails to get access code when an invalid NPSSO string is passed",
    async () => {
      try {
        await getAccessCode("awfulbadstringnotnpsso");
        assert(false);
      } catch (error) {
        assertIsError(error);
        assertEquals(
          error.message,
          "Malformed Access Code received, this usually happens because a bad NPSSO was provided. Please visit https://ca.account.sony.com/api/v1/ssocookie and double check if you have provided the correct NPSSO.",
        );
      }
    },
  );

  // Test if an error is thrown when getAuthorizationToken() receives an invalid accessCode string
  await t.step(
    "Fails to get an Authorization Token when a bad Access Code is provided",
    async () => {
      try {
        await getAuthorizationToken("verybadaccesscode");
        assert(false);
      } catch (error) {
        assertIsError(error);
        assertEquals(
          error.message,
          "Authentication failed! Failed to use Access Code to retrieve Authentication Token. Status code: 400, Error message: Bad Request",
        );
      }
    },
  );
});
