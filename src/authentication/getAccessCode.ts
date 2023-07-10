import { ACCESS_CODE_ENDPOINT, BASE_URL } from "../../data/base/urls.ts";

/**
 * Exchanges the `NPSSO` for the 9 digits Access Code starting with "v3."
 *
 * @param npsso The string received when accessing https://ca.account.sony.com/api/v1/ssocookie while logged in with a valid PSN account.
 */
export async function getAccessCode(npsso: string) {
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
