// Authentication functions
import { getAccessCode } from "./getAccessCode.ts";
import { getAuthorizationToken } from "./getAuthorizationToken.ts";

/**
 * Attempts to authenticate on PSN using a `NPSSO` code and returns your access/refresh tokens if successful.
 *
 * @param npsso The string received when accessing https://ca.account.sony.com/api/v1/ssocookie while logged in with a valid PSN account.
 * @param disableManager If provided as true, returns an `AuthenticationData` object, but doesn't initialize the `AuthenticationManager`. If not provided, doesn't return anything, but initializes the `AuthenticationManager`.
 * @returns An `AuthenticationData` object with data required to request further data from other endpoints.
 */
export async function authenticateWithNpsso(
  npsso: string,
  disableManager?: true,
) {
  if (npsso === undefined) {
    throw new Error(
      "No NPSSO was provided, therefore it's impossible to authenticate with PSN. Please provide a NPSSO as the parameter of this function and try again.",
    );
  }
  const accessCode = await getAccessCode(npsso);
  const authorization = await getAuthorizationToken(accessCode, disableManager);
  if (disableManager === true) {
    return authorization;
  }
}
