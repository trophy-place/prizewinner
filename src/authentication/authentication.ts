import {
  ACCESS_CODE_ENDPOINT,
  AUTHORIZATION_TOKEN_ENDPOINT,
  BASE_URL,
} from "../../data/urls.ts";

/**
 * Data returned when authenticating on PSN.
 * Irrelevant data for subsequent requests: `token_type`, `scope` and `id_token`.
 *
 * @property access_token The short duration token that is responsible for authenticating the user on PSN and allowing requests to return useful protected data. This token has a duration of 1 hour from the moment it was created and needs to be recreated/refreshed using `refresh_token`.
 * @property expires_in Time until `access_token` expires (default 1 hour).
 * @property refresh_token Refresh token used to create another `access_token` without requiring the user to login again using the NPSSO.
 * @property refresh_token_expires_in Seconds until `refresh_token` expires (default 60 days).
 */
interface AuthenticatedResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
}

/**
 * Relevant data required to manage authentication of an account.
 * All fields need to be sent on subsequent requests to ensure that the requested data gets returned, except for `humanReadableTokenExpiration` and `humanReadableRefreshTokenExpiration` that are added for convenience.
 *
 * @property accessToken The short duration token that is responsible for authenticating the user on PSN and allowing requests to return useful protected data. This token has a duration of 1 hour from the moment it was created and needs to be recreated/refreshed using `refreshToken`.
 * @property tokenExpirationEpoch Epoch timestamp of when the `accessToken` will expire.
 * @property humanReadableTokenExpiration Optional field added for convenience that converts `tokenExpirationEpoch` into a human readable timestamp on ISO format. This field is optional and doesn't need to be sent back when requesting data.
 * @property refreshToken Refresh token used to create another `accessToken` without requiring the user to login again using the NPSSO.
 * @property refreshTokenExpirationEpoch Epoch timestamp of when the `refreshToken` will expire.
 * @property humanReadableRefreshTokenExpiration Optional field added for convenience that converts `refreshToken` into a human readable timestamp on ISO format. This field is optional and doesn't need to be sent back when requesting data.
 */
interface AuthenticationData {
  accessToken: string;
  tokenExpirationEpoch: number;
  humanReadableTokenExpiration: string;
  refreshToken: string;
  refreshTokenExpirationEpoch: number;
  humanReadableRefreshTokenExpiration: string;
}

/**
 * Attempts to authenticate on PSN using a NPSSO code and returns your access/refresh tokens if successful.
 *
 * @param npsso The string received when accessing https://ca.account.sony.com/api/v1/ssocookie while logged in with a valid PSN account.
 * @returns AuthenticationData object with data required to request further data from other endpoints.
 */
export async function authenticateWithNpsso(npsso: string) {
  if (npsso === undefined) {
    throw new Error(
      "No NPSSO was provided, therefore it's impossible to authenticate with PSN. Please provide a NPSSO as the parameter of this function and try again.",
    );
  }
  const accessCode = await getAccessCode(npsso);
  const authorization = await getAuthorizationToken(accessCode);
  return authorization;
}

/**
 * Exchanges the NPSSO for the 9 digits Access Code starting with 'v3.'
 *
 * @param npsso The string received when accessing https://ca.account.sony.com/api/v1/ssocookie while logged in with a valid PSN account.
 */
async function getAccessCode(npsso: string) {
  const options: RequestInit = {
    "headers": {
      "Cookie": "npsso=" + npsso,
    },
    "redirect": "manual", // Disable redirects
  };
  const req = await fetch(BASE_URL + ACCESS_CODE_ENDPOINT, options);
  req.body?.cancel(); // Dispose the body to avoid memory leaks
  const locationHeader = req.headers.get("Location"); // Get the access code from the Location header

  // If there is no Location header, the request failed to start authentication
  if (locationHeader === null) {
    throw new Error(
      "Unable to retrieve the Access Code. Please visit https://ca.account.sony.com/api/v1/ssocookie and double check if you have provided the correct NPSSO.",
    );
  }

  // Extract the access code from the Location Header
  const accessCode = locationHeader.replace(/.*code=/g, "").replace(
    /&cid=.*/g,
    "",
  );

  // Throw error if the accessCode is longer than 10 characters. Something changed and we were unable to properly trim the accessCode from the Location Header.
  if (accessCode.length > 10) {
    throw new Error(
      "Malformed Access Code received, this usually happens because a bad NPSSO was provided. Please visit https://ca.account.sony.com/api/v1/ssocookie and double check if you have provided the correct NPSSO.",
    );
  }

  return accessCode;
}

async function getAuthorizationToken(accessCode: string) {
  const authorizationHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization":
      "Basic MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=",
  };

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
    await res.body?.cancel();
    throw new Error(
      `Authentication failed! Failed to use Access Code to retrieve Authentication Token. Status code: ${res.status.toString()}, Error message: ${res.statusText}`,
    );
  }
  const authenticationResponse: AuthenticatedResponse = await res.json();

  const { access_token, expires_in, refresh_token, refresh_token_expires_in } =
    authenticationResponse;

  const now = Date.now();
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
