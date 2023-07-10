// Data
import { authenticationManagerNotInitializedErrorMessage } from "../data/authentication/authenticationManagerNotInitializedErrorMessage.ts";
import { expiredRefreshTokenErrorMessage } from "../data/authentication/expiredRefreshTokenErrorMessage.ts";
//
import { refreshAuthorizationToken } from "../src/authentication/refreshAuthorizationToken.ts";
// Types
import type { AuthenticationData } from "../types/authentication/AuthenticationData_type.ts";
// Utility functions
import { nowTimestamp } from "./nowTimestamp.ts";

/**
 * Automatically manages your authentication status for you, if initialized. To initialize, don't pass `true` as the second parameter of `authenticateWithNpsso()`.
 *
 * If initialize, `AuthenticationManager` will be used by all functions to automatically refresh your expired `accessToken` whenever you make a request for data.
 *
 * `AuthenticationManager` cannot create a new NPSSO for you, so its maximum lifetime is 60 days, exactly how long `refreshToken` lives for. You will need to authenticate again using a new NPSSO as parameter to `authenticateWithNpsso()` to initialize another `AuthenticationManager`.
 */
class AuthenticationManager {
  #initialized = false;
  #accessToken = "";
  #tokenExpirationEpoch = 0;
  #humanReadableTokenExpiration = "";
  #refreshToken = "";
  #refreshTokenExpirationEpoch = 0;
  #humanReadableRefreshTokenExpiration = "";

  /**
   * Gets a valid `accessToken` if you haven't previously disabled the initialization of the `AuthenticationManager`. Throws an error if you never initialized the `AuthenticationManager` or if your `refreshToken` is too old to be refreshed.
   *
   * @returns `accessToken`
   */
  async getAccessCode() {
    if (this.#initialized === false) {
      throw new Error(authenticationManagerNotInitializedErrorMessage);
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
   * Retrieve the entire Authentication token.
   *
   * @returns A `AuthenticationData` object returned by either `refreshAuthorizationToken()` or `authenticateWithNpsso()`.
   */
  getFullToken() {
    if (this.#initialized === false) {
      throw new Error(authenticationManagerNotInitializedErrorMessage);
    }

    const token: AuthenticationData = {
      accessToken: this.#accessToken,
      tokenExpirationEpoch: this.#tokenExpirationEpoch,
      humanReadableTokenExpiration: this.#humanReadableTokenExpiration,
      refreshToken: this.#refreshToken,
      refreshTokenExpirationEpoch: this.#refreshTokenExpirationEpoch,
      humanReadableRefreshTokenExpiration:
        this.#humanReadableRefreshTokenExpiration,
    };
    return token;
  }

  /**
   * Updates the `AuthenticationManager`'s token properties.
   *
   * @param token A `AuthenticationData` object returned by either `refreshAuthorizationToken()` or `authenticateWithNpsso()`.
   */
  #setToken(token: AuthenticationData) {
    this.#accessToken = token.accessToken;
    this.#tokenExpirationEpoch = token.tokenExpirationEpoch;
    this.#humanReadableTokenExpiration = token.humanReadableTokenExpiration;
    this.#refreshToken = token.refreshToken;
    this.#refreshTokenExpirationEpoch = token.refreshTokenExpirationEpoch;
    this.#humanReadableRefreshTokenExpiration =
      token.humanReadableRefreshTokenExpiration;
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
   * @param token A `AuthenticationData` object returned by either `refreshAuthorizationToken()` or `authenticateWithNpsso()`.
   */
  initializeToken(token: AuthenticationData) {
    this.#setToken(token);
    this.#initialized = true;
  }
}

export const Auth = new AuthenticationManager();
