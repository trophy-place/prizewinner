// Data
import { authorizationHeaders } from "../../data/authentication/authenticationHeaders.ts";
import {
  AUTHORIZATION_TOKEN_ENDPOINT,
  BASE_URL,
} from "../../data/base/urls.ts";
// Helper functions
import { nowTimestamp } from "../../services/nowTimestamp.ts";
// Types
import type { AuthenticatedResponse } from "../../types/authentication/AuthenticatedResponse_type.ts";
import type { AuthenticationData } from "../../types/authentication/AuthenticationData_type.ts";

/**
 * Updates the Authentication Token to allow new requests to be executed.
 *
 * @param token `AuthenticationData` object provided by a successful authentication with `getAuthorizationToken()` or `authenticateWithNpsso()`.
 * @returns A new `AuthenticationData` object with data required to request further data from other endpoints.
 */
export async function refreshAuthorizationToken(token: AuthenticationData) {
  // Throw error if invalid parameter or refreshToken was provided
  if (token === undefined || typeof token.refreshToken !== "string") {
    throw new Error(
      'No valid "refreshToken" passed, impossible to refresh accessToken without one.',
    );
  }

  const now = nowTimestamp();

  // Throw error if no valid refreshToken timestamp is provided
  if (typeof token.refreshTokenExpirationEpoch !== "number") {
    throw new Error(
      "Token doesn't provide a numerical 'refreshTokenExpirationEpoch', required to check if the refreshToken is within refresh Date range.",
    );
  }

  // Throw error if the refreshToken timestamp expired
  if (now > token.refreshTokenExpirationEpoch) {
    throw new Error(
      'The "refreshToken" is too old to be refreshed. Please login again using a new NPSSO.',
    );
  }

  const authorizationRequestBody = new URLSearchParams({
    "refresh_token": token.refreshToken,
    "grant_type": "refresh_token",
    "token_format": "jwt",
    "scope": "psn:mobile.v2.core psn:clientapp",
  }).toString();

  const authorizationRequestOptions: RequestInit = {
    "method": "POST",
    "headers": authorizationHeaders,
    "body": authorizationRequestBody,
  };

  const res = await fetch(
    BASE_URL + AUTHORIZATION_TOKEN_ENDPOINT,
    authorizationRequestOptions,
  );

  if (res.status !== 200) {
    await res.body?.cancel(); // Dispose the body to avoid memory leaks
    throw new Error(
      `Authentication failed! Failed to use Refresh Token to retrieve an updated Authentication Token. Status code: ${res.status.toString()}, Error message: ${res.statusText}`,
    );
  }
  const authenticationResponse: AuthenticatedResponse = await res.json();

  const { access_token, expires_in, refresh_token, refresh_token_expires_in } =
    authenticationResponse;

  const authentication: AuthenticationData = {
    accessToken: access_token,
    tokenExpirationEpoch: now + expires_in * 1000,
    humanReadableTokenExpiration: new Date(now + expires_in * 1000)
      .toISOString(),
    refreshToken: refresh_token,
    refreshTokenExpirationEpoch: now + refresh_token_expires_in * 1000,
    humanReadableRefreshTokenExpiration: new Date(
      now + refresh_token_expires_in * 1000,
    ).toISOString(),
  };

  return authentication;
}
