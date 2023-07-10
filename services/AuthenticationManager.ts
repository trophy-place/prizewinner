// Data
import { expiredRefreshTokenErrorMessage } from "../data/authentication/expiredRefreshTokenErrorMessage.ts";
//
import { refreshAuthorizationToken } from "../src/authentication/refreshAuthorizationToken.ts";
// Types
import type { AuthenticationData } from "../types/authentication/AuthenticationData_type.ts";
// Utility functions
import { nowTimestamp } from "./nowTimestamp.ts";

/**
 * Automatically manages your authentication status for you, if initialized. To initialize, don't pass `true` as the second parameter of neither `authenticateWithNpsso()` nor `refreshAuthorizationToken()`.
 *
 * If initialize, `AuthenticationManager` will be used by all functions to automatically refresh your expired `accessToken` whenever you make a request for data.
 *
 * `AuthenticationManager` cannot create a new NPSSO for you, so its maximum lifetime is 60 days, exactly how long `refreshToken` lives for. You will need to authenticate again using a new NPSSO as parameter to `authenticateWithNpsso()` to initialize another `AuthenticationManager`.
 */
class AuthenticationManager {
  #initialized = false;
  #accessToken = "";
  #tokenExpirationEpoch = 0;
  #refreshToken = "";
  #refreshTokenExpirationEpoch = 0;

  /**
   * Gets a valid `accessToken` if you haven't previously disabled the initialization of the `AuthenticationManager`. Throws an error if you never initialized the `AuthenticationManager` or if your `refreshToken` is too old to be refreshed.
   *
   * @returns `accessToken`
   */
  async getAccessCode() {
    if (this.#initialized === false) {
      throw new Error(
        "Cannot return token because you have never initialized the AuthenticationManager. Please run 'authenticateWithNpsso()' and don't pass the second parameter as 'true' to initialize the AuthenticationManager if you want your authentication to be automatically managed for you.",
      );
    }

    const now = nowTimestamp();

    if (this.#tokenExpirationEpoch < now) {
      if (this.#refreshTokenExpirationEpoch < now) {
        throw new Error(expiredRefreshTokenErrorMessage);
      }
      await this.#automaticTokenUpdate();
    }
    return this.#accessToken;
  }

  /**
   * Updates the `AuthenticationManager`'s token properties.
   *
   * @param token An `AuthenticationData` object returned by either `refreshAuthorizationToken()` or `authenticateWithNpsso()`.
   */
  #setToken(token: AuthenticationData) {
    this.#accessToken = token.accessToken;
    this.#tokenExpirationEpoch = token.tokenExpirationEpoch;
    this.#refreshToken = token.refreshToken;
    this.#refreshTokenExpirationEpoch = token.refreshTokenExpirationEpoch;
  }

  /**
   * Refreshes the `accessToken` automatically whenever `getAccessCode()` is executed with an expired `accessCode`.
   */
  async #automaticTokenUpdate() {
    const refreshedAuthentication: AuthenticationData =
      await refreshAuthorizationToken({
        refreshToken: this.#refreshToken,
        refreshTokenExpirationEpoch: this.#refreshTokenExpirationEpoch,
      });

    this.#setToken(refreshedAuthentication);
  }

  /**
   * Initialize this instance of `AuthenticationManager`.
   *
   * @param token An `AuthenticationData` object returned by either `refreshAuthorizationToken()` or `authenticateWithNpsso()`.
   */
  initializeToken(token: AuthenticationData) {
    this.#setToken(token);
    this.#initialized = true;
  }
}

export const Auth = new AuthenticationManager();
