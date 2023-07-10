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
export interface AuthenticationData {
  accessToken: string;
  tokenExpirationEpoch: number;
  humanReadableTokenExpiration: string;
  refreshToken: string;
  refreshTokenExpirationEpoch: number;
  humanReadableRefreshTokenExpiration: string;
}
