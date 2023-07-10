// Data
import { authorizationHeaders } from "../../data/authentication/authenticationHeaders.ts";
import {
  AUTHORIZATION_TOKEN_ENDPOINT,
  BASE_URL,
} from "../../data/base/urls.ts";
// Helper functions
import { nowTimestamp } from "../../services/nowTimestamp.ts";
// Types
import { AuthenticatedResponse } from "../../types/authentication/AuthenticatedResponse_type.ts";
import { AuthenticationData } from "../../types/authentication/AuthenticationData_type.ts";

/**
 * Authenticates on PSN using the `accessCode` and returns your access/refresh tokens if successful.
 *
 * @param accessCode String returned by `getAccessCode()` when providing a valid NPSSO as parameter.
 * @returns `AuthenticationData` object with data required to request further data from other endpoints.
 */
export async function getAuthorizationToken(accessCode: string) {
  const authorizationRequestBody = new URLSearchParams({
    "code": accessCode,
    "redirect_uri": "com.scee.psxandroid.scecompcall://redirect",
    "grant_type": "authorization_code",
    "token_format": "jwt",
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
      `Authentication failed! Failed to use Access Code to retrieve Authentication Token. Status code: ${res.status.toString()}, Error message: ${res.statusText}`,
    );
  }
  const authenticationResponse: AuthenticatedResponse = await res.json();

  const { access_token, expires_in, refresh_token, refresh_token_expires_in } =
    authenticationResponse;

  const now = nowTimestamp();
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
