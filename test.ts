// Test assertion
import {
  assert,
  assertEquals,
  assertIsError,
  assertNotEquals,
} from "https://deno.land/std@0.193.0/testing/asserts.ts";
// Load .env values
import { load } from "https://deno.land/std@0.193.0/dotenv/mod.ts";
// Data
import { expiredRefreshTokenErrorMessage } from "./data/authentication/expiredRefreshTokenErrorMessage.ts";
// Types
import type { AuthenticationData } from "./types/authentication/AuthenticationData_type.ts";
// Internal functions to test
import { authenticateWithNpsso } from "./src/authentication/authenticateWithNpsso.ts";
import { getAccessCode } from "./src/authentication/getAccessCode.ts";
import { getAuthorizationToken } from "./src/authentication/getAuthorizationToken.ts";
import { refreshAuthorizationToken } from "./src/authentication/refreshAuthorizationToken.ts";

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
  // Test if an error is thrown when a bad NPSSO string is passed as parameter of getAccessCode()
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

// Tests for refreshing Authentication Tokens
Deno.test("Refresh Authentication Token using Refresh Token", async (t) => {
  // Test if refreshAuthorizationToken() throws the correct errors
  await t.step(
    "Checking if refreshAuthorizationToken() handles all error cases",
    async (t) => {
      // Throws error when no token is provided
      await t.step(
        "refreshAuthorizationToken() throws error when no token is provided",
        async () => {
          try {
            // @ts-ignore: Not passing arguments on purpose to check for error handling
            await refreshAuthorizationToken();
            assert(false);
          } catch (error) {
            assertIsError(error);
            assertEquals(
              error.message,
              'No valid "refreshToken" passed, impossible to refresh accessToken without one.',
            );
          }
        },
      );

      // Throws error when token doesn't have a refreshToken field
      await t.step(
        "refreshAuthorizationToken() throws error when refreshToken isn't a string",
        async () => {
          try {
            await refreshAuthorizationToken({
              ...auth,
              // @ts-ignore: Removing required property to check for error handling
              refreshToken: undefined,
            });
            assert(false);
          } catch (error) {
            assertIsError(error);
            assertEquals(
              error.message,
              'No valid "refreshToken" passed, impossible to refresh accessToken without one.',
            );
          }
        },
      );

      // Throws error when token's refreshTokenExpirationEpoch isn't a number
      await t.step(
        "refreshAuthorizationToken() throws error when refreshTokenExpirationEpoch property isn't a number",
        async () => {
          try {
            await refreshAuthorizationToken({
              ...auth,
              // @ts-ignore: Removing required property to check for error handling
              refreshTokenExpirationEpoch: undefined,
            });
            assert(false);
          } catch (error) {
            assertIsError(error);
            assertEquals(
              error.message,
              "Token doesn't provide a numerical 'refreshTokenExpirationEpoch', required to check if the refreshToken is within refresh Date range.",
            );
          }
        },
      );

      // Throws error when token's refreshTokenExpirationEpoch has expired
      await t.step(
        "refreshAuthorizationToken() throws error when refreshTokenExpirationEpoch is too old to refresh the token",
        async () => {
          try {
            await refreshAuthorizationToken({
              ...auth,
              refreshTokenExpirationEpoch: auth.refreshTokenExpirationEpoch -
                99999999999999,
            });
            assert(false);
          } catch (error) {
            assertIsError(error);
            assertEquals(
              error.message,
              expiredRefreshTokenErrorMessage,
            );
          }
        },
      );
    },
  );

  // Test if the token has the correct refreshToken property type
  await t.step("Test if the refreshToken is a string", () => {
    assertEquals(typeof auth.refreshToken, "string");
  });

  // Test if the token has the correct refreshTokenExpirationEpoch property type
  await t.step("Test if the refreshTokenExpirationEpoch is a number", () => {
    assertEquals(typeof auth.refreshTokenExpirationEpoch, "number");
  });

  // Test if the token can still be refreshed
  await t.step(
    "Test if the refreshToken is still valid",
    () => {
      assert(auth.refreshTokenExpirationEpoch > Date.now());
    },
  );

  // Test if the token would allow us to refresh the authentication status
  await t.step(
    "Test if we are able to refresh the authentication token",
    async (tt) => {
      const refreshedAuthorization = await refreshAuthorizationToken(auth);

      await tt.step("Refreshed authorization has accessToken", () => {
        assertEquals(typeof refreshedAuthorization.accessToken, "string");
      });
      await tt.step("Refreshed authorization has tokenExpirationEpoch", () => {
        assertEquals(
          typeof refreshedAuthorization.tokenExpirationEpoch,
          "number",
        );
      });
      await tt.step(
        "Refreshed authorization has humanReadableTokenExpiration",
        () => {
          assertEquals(
            typeof refreshedAuthorization.humanReadableTokenExpiration,
            "string",
          );
        },
      );
      await tt.step("Refreshed authorization has refreshToken", () => {
        assertEquals(typeof refreshedAuthorization.refreshToken, "string");
      });
      await tt.step("Refreshed authorization has tokenExpirationEpoch", () => {
        assertEquals(
          typeof refreshedAuthorization.tokenExpirationEpoch,
          "number",
        );
      });
      await tt.step(
        "Refreshed authorization has humanReadableRefreshTokenExpiration",
        () => {
          assertEquals(
            typeof refreshedAuthorization.humanReadableRefreshTokenExpiration,
            "string",
          );
        },
      );
    },
  );
});
