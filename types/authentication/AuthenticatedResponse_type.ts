/**
 * Data returned when authenticating on PSN.
 * Irrelevant data for subsequent requests: `token_type`, `scope` and `id_token`.
 *
 * @property access_token The short duration token that is responsible for authenticating the user on PSN and allowing requests to return useful protected data. This token has a duration of 1 hour from the moment it was created and needs to be recreated/refreshed using `refresh_token`.
 * @property expires_in Time until `access_token` expires (default 1 hour).
 * @property refresh_token Refresh token used to create another `access_token` without requiring the user to login again using the NPSSO.
 * @property refresh_token_expires_in Seconds until `refresh_token` expires (default 60 days).
 */
export interface AuthenticatedResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
}
